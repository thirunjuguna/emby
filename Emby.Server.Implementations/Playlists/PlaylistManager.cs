﻿using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Entities.Audio;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Playlists;
using MediaBrowser.Controller.Providers;
using MediaBrowser.Model.Entities;
using MediaBrowser.Model.Logging;
using MediaBrowser.Model.Playlists;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediaBrowser.Controller.Dto;
using MediaBrowser.Model.IO;
using MediaBrowser.Model.Extensions;

namespace Emby.Server.Implementations.Playlists
{
    public class PlaylistManager : IPlaylistManager
    {
        private readonly ILibraryManager _libraryManager;
        private readonly IFileSystem _fileSystem;
        private readonly ILibraryMonitor _iLibraryMonitor;
        private readonly ILogger _logger;
        private readonly IUserManager _userManager;
        private readonly IProviderManager _providerManager;

        public PlaylistManager(ILibraryManager libraryManager, IFileSystem fileSystem, ILibraryMonitor iLibraryMonitor, ILogger logger, IUserManager userManager, IProviderManager providerManager)
        {
            _libraryManager = libraryManager;
            _fileSystem = fileSystem;
            _iLibraryMonitor = iLibraryMonitor;
            _logger = logger;
            _userManager = userManager;
            _providerManager = providerManager;
        }

        public IEnumerable<Playlist> GetPlaylists(string userId)
        {
            var user = _userManager.GetUserById(userId);

            return GetPlaylistsFolder(userId).GetChildren(user, true).OfType<Playlist>();
        }

        public async Task<PlaylistCreationResult> CreatePlaylist(PlaylistCreationRequest options)
        {
            var name = options.Name;

            var folderName = _fileSystem.GetValidFilename(name) + " [playlist]";

            var parentFolder = GetPlaylistsFolder(null);

            if (parentFolder == null)
            {
                throw new ArgumentException();
            }

            if (string.IsNullOrWhiteSpace(options.MediaType))
            {
                foreach (var itemId in options.ItemIdList)
                {
                    var item = _libraryManager.GetItemById(itemId);

                    if (item == null)
                    {
                        throw new ArgumentException("No item exists with the supplied Id");
                    }

                    if (!string.IsNullOrWhiteSpace(item.MediaType))
                    {
                        options.MediaType = item.MediaType;
                    }
                    else if (item is MusicArtist || item is MusicAlbum || item is MusicGenre)
                    {
                        options.MediaType = MediaType.Audio;
                    }
                    else if (item is Genre)
                    {
                        options.MediaType = MediaType.Video;
                    }
                    else
                    {
                        var folder = item as Folder;
                        if (folder != null)
                        {
                            options.MediaType = folder.GetRecursiveChildren(i => !i.IsFolder && i.SupportsAddingToPlaylist)
                                .Select(i => i.MediaType)
                                .FirstOrDefault(i => !string.IsNullOrWhiteSpace(i));
                        }
                    }

                    if (!string.IsNullOrWhiteSpace(options.MediaType))
                    {
                        break;
                    }
                }
            }

            if (string.IsNullOrWhiteSpace(options.MediaType))
            {
                options.MediaType = "Audio";
            }

            var user = _userManager.GetUserById(options.UserId);

            var path = Path.Combine(parentFolder.Path, folderName);
            path = GetTargetPath(path);

            _iLibraryMonitor.ReportFileSystemChangeBeginning(path);

            try
            {
                _fileSystem.CreateDirectory(path);

                var playlist = new Playlist
                {
                    Name = name,
                    Path = path
                };

                playlist.Shares.Add(new Share
                {
                    UserId = options.UserId,
                    CanEdit = true
                });

                playlist.SetMediaType(options.MediaType);

                parentFolder.AddChild(playlist, CancellationToken.None);

                await playlist.RefreshMetadata(new MetadataRefreshOptions(_fileSystem) { ForceSave = true }, CancellationToken.None)
                    .ConfigureAwait(false);

                if (options.ItemIdList.Length > 0)
                {
                    await AddToPlaylistInternal(playlist.Id.ToString("N"), options.ItemIdList, user, new DtoOptions(false)
                    {
                        EnableImages = true
                    });
                }

                return new PlaylistCreationResult
                {
                    Id = playlist.Id.ToString("N")
                };
            }
            finally
            {
                // Refresh handled internally
                _iLibraryMonitor.ReportFileSystemChangeComplete(path, false);
            }
        }

        private string GetTargetPath(string path)
        {
            while (_fileSystem.DirectoryExists(path))
            {
                path += "1";
            }

            return path;
        }

        private List<BaseItem> GetPlaylistItems(IEnumerable<string> itemIds, string playlistMediaType, User user, DtoOptions options)
        {
            var items = itemIds.Select(i => _libraryManager.GetItemById(i)).Where(i => i != null);

            return Playlist.GetPlaylistItems(playlistMediaType, items, user, options);
        }

        public Task AddToPlaylist(string playlistId, IEnumerable<string> itemIds, string userId)
        {
            var user = string.IsNullOrWhiteSpace(userId) ? null : _userManager.GetUserById(userId);

            return AddToPlaylistInternal(playlistId, itemIds, user, new DtoOptions(false)
            {
                EnableImages = true
            });
        }

        private async Task AddToPlaylistInternal(string playlistId, IEnumerable<string> itemIds, User user, DtoOptions options)
        {
            var playlist = _libraryManager.GetItemById(playlistId) as Playlist;

            if (playlist == null)
            {
                throw new ArgumentException("No Playlist exists with the supplied Id");
            }

            var list = new List<LinkedChild>();

            var items = (GetPlaylistItems(itemIds, playlist.MediaType, user, options))
                .Where(i => i.SupportsAddingToPlaylist)
                .ToList();

            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.Path))
                {
                    continue;
                }

                list.Add(LinkedChild.Create(item));
            }

            var newList = playlist.LinkedChildren.ToList();
            newList.AddRange(list);
            playlist.LinkedChildren = newList.ToArray(newList.Count);

            await playlist.UpdateToRepository(ItemUpdateType.MetadataEdit, CancellationToken.None).ConfigureAwait(false);

            _providerManager.QueueRefresh(playlist.Id, new MetadataRefreshOptions(_fileSystem)
            {
                ForceSave = true

            }, RefreshPriority.High);
        }

        public async Task RemoveFromPlaylist(string playlistId, IEnumerable<string> entryIds)
        {
            var playlist = _libraryManager.GetItemById(playlistId) as Playlist;

            if (playlist == null)
            {
                throw new ArgumentException("No Playlist exists with the supplied Id");
            }

            var children = playlist.GetManageableItems().ToList();

            var idList = entryIds.ToList();

            var removals = children.Where(i => idList.Contains(i.Item1.Id));

            playlist.LinkedChildren = children.Except(removals)
                .Select(i => i.Item1)
                .ToArray();

            await playlist.UpdateToRepository(ItemUpdateType.MetadataEdit, CancellationToken.None).ConfigureAwait(false);

            _providerManager.QueueRefresh(playlist.Id, new MetadataRefreshOptions(_fileSystem)
            {
                ForceSave = true

            }, RefreshPriority.High);
        }

        public async Task MoveItem(string playlistId, string entryId, int newIndex)
        {
            var playlist = _libraryManager.GetItemById(playlistId) as Playlist;

            if (playlist == null)
            {
                throw new ArgumentException("No Playlist exists with the supplied Id");
            }

            var children = playlist.GetManageableItems().ToList();

            var oldIndex = children.FindIndex(i => string.Equals(entryId, i.Item1.Id, StringComparison.OrdinalIgnoreCase));

            if (oldIndex == newIndex)
            {
                return;
            }

            var item = playlist.LinkedChildren[oldIndex];

            var newList = playlist.LinkedChildren.ToList();

            newList.Remove(item);

            if (newIndex >= newList.Count)
            {
                newList.Add(item);
            }
            else
            {
                newList.Insert(newIndex, item);
            }

            playlist.LinkedChildren = newList.ToArray(newList.Count);

            await playlist.UpdateToRepository(ItemUpdateType.MetadataEdit, CancellationToken.None).ConfigureAwait(false);
        }

        public Folder GetPlaylistsFolder(string userId)
        {
            var typeName = "PlaylistsFolder";

            return _libraryManager.RootFolder.Children.OfType<Folder>().FirstOrDefault(i => string.Equals(i.GetType().Name, typeName, StringComparison.Ordinal)) ??
                _libraryManager.GetUserRootFolder().Children.OfType<Folder>().FirstOrDefault(i => string.Equals(i.GetType().Name, typeName, StringComparison.Ordinal));
        }
    }
}

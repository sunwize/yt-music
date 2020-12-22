class Parser {

    static parseSuggestions(data) {
        return data.contents[0].searchSuggestionsSectionRenderer.contents.map(s => s.searchSuggestionRenderer.navigationEndpoint.searchEndpoint.query);
    }

    static parseSearch(data, categoryName = null) {
        let results = [];
        const sections = data.contents.sectionListRenderer.contents;

        sections.forEach(section => {
            try {
                const items = section.musicShelfRenderer.contents;
                const type = categoryName ? String(categoryName).toLowerCase() : items[0].musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text.toLowerCase();

                if (['song', 'video'].includes(type)) {
                    items.forEach(item => {
                        try {
                            const info0 = item.musicResponsiveListItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0];
                            let index = categoryName ? 0 : 2;
                            const authorInfo = item.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[index];

                            index = categoryName ? 2 : 4;
                            const moreInfo = item.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[index];

                            const song = {
                                type,
                                id: info0.navigationEndpoint ? info0.navigationEndpoint.watchEndpoint.videoId : null,
                                playlistId: info0.navigationEndpoint ? info0.navigationEndpoint.watchEndpoint.playlistId : null,
                                name: info0.text,
                                author: {
                                    id: authorInfo.navigationEndpoint.browseEndpoint.browseId,
                                    name: authorInfo.text
                                },
                                thumbnails: item.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails
                            }

                            if (type === 'song') {
                                song.album = {
                                    id: moreInfo.navigationEndpoint.browseEndpoint.browseId,
                                    title: moreInfo.text
                                };
                            } else if (type === 'video') {
                                song.viewCount = moreInfo.text.split(' ')[0];
                            }

                            results.push(song);
                        } catch {}
                    });
                } else if (type === 'playlist') {
                    items.forEach(item => {
                        try {
                            const info0 = item.musicResponsiveListItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text;
                            const info1 = item.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text;

                            results.push({
                                type: 'playlist',
                                id: item.musicResponsiveListItemRenderer.overlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer.playNavigationEndpoint.watchPlaylistEndpoint.playlistId,
                                title: info0.runs[0].text,
                                trackCount: parseInt(info1.runs[info1.runs.length - 1].text.split(' ')[0]),
                                thumbnails: item.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails
                            });
                        } catch {}
                    });
                } else if (type === 'album') {
                    items.forEach(item => {
                        try {
                            const info0 = item.musicResponsiveListItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text;
                            const info1 = item.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text;
                            const typeName = item.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text.toLowerCase();

                            results.push({
                                type: typeName,
                                id: item.musicResponsiveListItemRenderer.navigationEndpoint.browseEndpoint.browseId,
                                title: info0.runs[0].text,
                                author: {
                                    id: info1.runs[2].navigationEndpoint.browseEndpoint.browseId,
                                    name: info1.runs[2].text
                                },
                                year: parseInt(info1.runs[info1.runs.length - 1].text),
                                thumbnails: item.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails
                            });
                        } catch {}
                    });
                } else if (type === 'artist') {
                    items.forEach(item => {
                        try {
                            const info = item.musicResponsiveListItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text;

                            results.push({
                                type: 'artist',
                                id: item.musicResponsiveListItemRenderer.navigationEndpoint.browseEndpoint.browseId,
                                name: info.runs[0].text,
                                thumbnails: item.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails
                            });
                        } catch {}
                    });
                }
            } catch {}
        });

        return results;
    }

    static parseSong(data) {
        const info = data.contents.singleColumnMusicWatchNextResultsRenderer.tabbedRenderer.watchNextTabbedResultsRenderer.tabs[0].tabRenderer.content.musicQueueRenderer.content.playlistPanelRenderer;
        const authorInfo = info.contents[0].playlistPanelVideoRenderer.longBylineText.runs[0];
        const albumInfo = info.contents[0].playlistPanelVideoRenderer.longBylineText.runs[2];

        const song = {
            name: info.title,
            author: {
                id: authorInfo.navigationEndpoint.browseEndpoint.browseId,
                name: authorInfo.text
            },
            thumbnails: info.contents[0].playlistPanelVideoRenderer.thumbnail.thumbnails
        };

        if (albumInfo.navigationEndpoint) {
            song.album = {
                id: albumInfo.navigationEndpoint.browseEndpoint.browseId,
                title: albumInfo.text
            };
        } else {
            song.viewCount = albumInfo.text.split(' ')[0];
        }

        return song;
    }

    static parseArtist(data) {
        const getSection = name => {
            try {
                if (name.toLowerCase() === 'songs')
                    return data.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents.find(c => c.musicShelfRenderer && c.musicShelfRenderer.title.runs[0].text.toLowerCase() === name.toLowerCase()).musicShelfRenderer.contents;
                else
                    return data.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents.find(c => c.musicCarouselShelfRenderer && c.musicCarouselShelfRenderer.header.musicCarouselShelfBasicHeaderRenderer.title.runs[0].text.toLowerCase() === name.toLowerCase()).musicCarouselShelfRenderer.contents;
            } catch (err) {
                console.log(err);
                return [];
            }
        };

        const songs = getSection('songs').map(s => {
            const info = s.musicResponsiveListItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0];
            const authorInfo = s.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[0];
            const albumInfo = s.musicResponsiveListItemRenderer.flexColumns[2].musicResponsiveListItemFlexColumnRenderer.text.runs[0];

            return {
                type: 'song',
                id: info.navigationEndpoint.watchEndpoint.videoId,
                name: info.text,
                author: {
                    id: authorInfo.navigationEndpoint.browseEndpoint.browseId,
                    name: authorInfo.text
                },
                album: {
                    id: albumInfo.navigationEndpoint.browseEndpoint.browseId,
                    title: albumInfo.text
                },
                thumbnails: s.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails
            }
        });

        const videos = getSection('videos').map(v => {
            const authorInfo = v.musicTwoRowItemRenderer.subtitle.runs[0];

            return {
                type: 'video',
                id: v.musicTwoRowItemRenderer.navigationEndpoint.watchEndpoint.videoId,
                name: v.musicTwoRowItemRenderer.title.runs[0].text,
                author: {
                    id: authorInfo.navigationEndpoint.browseEndpoint.browseId,
                    name: authorInfo.text
                },
                viewCount: v.musicTwoRowItemRenderer.subtitle.runs[2].text.split(' ')[0]
            }
        });

        const albums = getSection('albums').map(a => {
            const info = a.musicTwoRowItemRenderer.title.runs[0];

            return {
                type: 'album',
                id: info.navigationEndpoint.browseEndpoint.browseId,
                title: info.text,
                year: parseInt(a.musicTwoRowItemRenderer.subtitle.runs[a.musicTwoRowItemRenderer.subtitle.runs.length - 1].text),
                thumbnails: a.musicTwoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails
            }
        });

        const singles = getSection('singles').map(a => {
            const info = a.musicTwoRowItemRenderer.title.runs[0];

            return {
                type: 'single',
                id: info.navigationEndpoint.browseEndpoint.browseId,
                title: info.text,
                year: parseInt(a.musicTwoRowItemRenderer.subtitle.runs[a.musicTwoRowItemRenderer.subtitle.runs.length - 1].text),
                thumbnails: a.musicTwoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails
            }
        });

        const featuredOn = getSection('featured on').map(f => {
            // const type = f.musicTwoRowItemRenderer.subtitle.runs[0].text.toLowerCase();
            const info = f.musicTwoRowItemRenderer.title.runs[0];
            const type = info.navigationEndpoint.browseEndpoint.browseEndpointContextSupportedConfigs.browseEndpointContextMusicConfig.pageType.split('_').pop().toLowerCase();

            return {
                type,
                id: info.navigationEndpoint.browseEndpoint.browseId,
                title: info.text,
                author: {
                    name: f.musicTwoRowItemRenderer.subtitle.runs[2].text
                },
                thumbnails: f.musicTwoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails
            }
        });

        const fansAlsoLike = getSection('fans might also like').map(f => {
            const info = f.musicTwoRowItemRenderer.title.runs[0];
            const type = info.navigationEndpoint.browseEndpoint.browseEndpointContextSupportedConfigs.browseEndpointContextMusicConfig.pageType.split('_').pop().toLowerCase();

            return {
                type,
                id: info.navigationEndpoint.browseEndpoint.browseId,
                name: info.text,
                thumbnails: f.musicTwoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails
            }
        });

        return {
            name: data.header.musicImmersiveHeaderRenderer.title.runs[0].text,
            subscribers: data.header.musicImmersiveHeaderRenderer.subscriptionButton.subscribeButtonRenderer.subscriberCountText.runs[0].text,
            thumbnails: data.header.musicImmersiveHeaderRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails,
            songs: songs.concat(videos),
            albums: albums.concat(singles),
            featuredOn,
            fansAlsoLike
        };
    }

    static parseAlbum(data) {
        let artists = data.frameworkUpdates.entityBatchUpdate.mutations.filter(m => !!m.payload.musicArtist).map(a => {
            const info = a.payload.musicArtist;

            return {
                id: info.id,
                name: info.name,
                thumbnails: info.thumbnailDetails.thumbnails
            }
        });

        let songs = data.frameworkUpdates.entityBatchUpdate.mutations.filter(m => !!m.payload.musicTrack).map(s => {
            const info = s.payload.musicTrack;

            return {
                id: info.videoId,
                name: info.title,
                thumbnails: info.thumbnailDetails.thumbnails,
                author: artists.filter(a => info.artists.includes(a.id))
            }
        });

        const info = data.frameworkUpdates.entityBatchUpdate.mutations.find(m => !!m.payload.musicAlbumRelease).payload.musicAlbumRelease;

        return {
            title: info.title,
            thumbnails: info.thumbnailDetails.thumbnails,
            author: artists.filter(a => info.primaryArtists.includes(a.id)),
            year: parseInt(info.releaseDate.year),
            songs
        };
    }

    static parsePlaylist(data) {
        const musicDetail = data.header.musicDetailHeaderRenderer;

        return {
            type: 'playlist',
            title: musicDetail.title.runs[0].text,
            trackCount: data.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].musicPlaylistShelfRenderer.collapsedItemCount,
            thumbnails: musicDetail.thumbnail.croppedSquareThumbnailRenderer.thumbnail.thumbnails,
            songs: this.parsePlaylistContents(data)
        };
    }

    static parsePlaylistContents(data) {
        let playlistContents;
        if (Object.keys(data).includes('continuationContents'))
            playlistContents = data.continuationContents.musicPlaylistShelfContinuation.contents;
        else
            playlistContents = data.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].musicPlaylistShelfRenderer.contents;

        playlistContents = playlistContents
            .map(s => this.parsePlaylistSong(s.musicResponsiveListItemRenderer))
            .filter(s => !!s);

        return playlistContents;
    }

    static parsePlaylistSong(item) {
        try {
            const videoInfo = item.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0];
            const authorInfo = item.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[0];
            const albumInfo = Array.isArray(item.flexColumns[2].musicResponsiveListItemFlexColumnRenderer.text.runs) ?
                item.flexColumns[2].musicResponsiveListItemFlexColumnRenderer.text.runs[0] : null;

            const song = {
                type: albumInfo ? 'song' : 'video',
                id: videoInfo.navigationEndpoint.watchEndpoint.videoId,
                name: videoInfo.text,
                author: {
                    id: authorInfo.navigationEndpoint.browseEndpoint.browseId,
                    name: authorInfo.text
                },
                thumbnails: item.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails
            };

            if (albumInfo) {
                song.album = {
                    id: albumInfo.navigationEndpoint.browseEndpoint.browseId,
                    title: albumInfo.text
                }
            }

            return song;
        } catch(err) {
            return null;
        }
    }

    static getPlaylistContinuation(data) {
        try {
            let continuations;
            if (Object.keys(data).includes('continuationContents'))
                continuations = data.continuationContents.musicPlaylistShelfContinuation.continuations;
            else
                continuations = data.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].musicPlaylistShelfRenderer.continuations;
            return continuations.find(c => typeof c.nextContinuationData === 'object').nextContinuationData;
        } catch (err) {
            return null;
        }

    }

}

module.exports = Parser;

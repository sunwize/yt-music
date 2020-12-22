module.exports = {
    createApiContext(ytcfg) {
        return {
            capabilities: {},
            client: {
                clientName: ytcfg.INNERTUBE_CLIENT_NAME,
                clientVersion: ytcfg.INNERTUBE_CLIENT_VERSION,
                experimentIds: [],
                experimentsToken: '',
                gl: ytcfg.GL,
                hl: ytcfg.HL,
                locationInfo: {
                    locationPermissionAuthorizationStatus: 'LOCATION_PERMISSION_AUTHORIZATION_STATUS_UNSUPPORTED',
                },
                musicAppInfo: {
                    musicActivityMasterSwitch: 'MUSIC_ACTIVITY_MASTER_SWITCH_INDETERMINATE',
                    musicLocationMasterSwitch: 'MUSIC_LOCATION_MASTER_SWITCH_INDETERMINATE',
                    pwaInstallabilityStatus: 'PWA_INSTALLABILITY_STATUS_UNKNOWN',
                },
                utcOffsetMinutes: -new Date().getTimezoneOffset(),
            },
            request: {
                internalExperimentFlags: [
                    {
                        key: 'force_music_enable_outertube_tastebuilder_browse',
                        value: 'true'
                    },
                    {
                        key: 'force_music_enable_outertube_playlist_detail_browse',
                        value: 'true'
                    },
                    {
                        key: 'force_music_enable_outertube_search_suggestions',
                        value: 'true',
                    },
                ],
                sessionIndex: {},
            },
            user: {
                enableSafetyMode: false,
            },
        };
    },
    createBrowseContext(type, browseId) {
        return {
            'browseEndpointContextSupportedConfigs': {
                'browseEndpointContextMusicConfig': {
                    'pageType': `MUSIC_PAGE_TYPE_${String(type).toUpperCase()}`
                }
            },
            'browseId': browseId
        };
    },
    getCategoryURI(categoryName) {
        let b64Key = '';
        switch (String(categoryName).toLowerCase()) {
            case 'song':
                b64Key = 'RAAGAAgACgA';
                break;
            case 'video':
                b64Key = 'BABGAAgACgA';
                break;
            case 'album':
                b64Key = 'BAAGAEgACgA';
                break;
            case 'artist':
                b64Key = 'BAAGAAgASgA';
                break;
            case 'playlist':
                b64Key = 'BAAGAAgACgB';
                break;
        }
        return categoryName && b64Key.length > 0 ? `Eg-KAQwIA${b64Key}MABqChAEEAMQCRAFEAo%3D` : null;
    }
}

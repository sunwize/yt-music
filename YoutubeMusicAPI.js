const axios = require('axios');
const tough = require('tough-cookie');
const Parser = require('./Parser.js');

const { createApiContext, createBrowseContext, getCategoryURI } = require('./utils.js');

class YoutubeMusicAPI {

    constructor() {
        // YT config object, used for api requests
        this.ytcfg = {};

        // Cookie jar
        this.cookies = new tough.CookieJar();

        // Axios instance
        this.client = axios.create({
            baseURL: 'https://music.youtube.com',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            withCredentials: true
        })

        // Request interceptor
        this.client.interceptors.request.use(req => {
            // Get cookies for this request
            const cookies = this.cookies.getCookieStringSync(req.baseURL);

            // Assign cookies to header if they exist
            if (cookies && cookies.length > 0)
                req.headers['Cookie'] = cookies;

            return req;
        }, err => Promise.reject(err));

        // Response interceptor
        this.client.interceptors.response.use(res => {
            // Check response has cookies to set
            if (!res.headers.hasOwnProperty('set-cookie'))
                return res;

            // Get response cookies
            let cookies = res.headers['set-cookie'];
            if (!Array.isArray(cookies))
                cookies = [cookies];

            // Put cookies in jar
            cookies.forEach(cookie => this.cookies.setCookieSync(tough.Cookie.parse(cookie), res.config.baseURL));
            return res;
        });

        // Get index and save ytcfg
        this.client.get('/')
            .then(res => {
                res.data.split('ytcfg.set(').map(v => {
                        try {
                            return JSON.parse(v.split(');')[0]);
                        } catch (_) {}
                    })
                    .filter(value => !!value)
                    .forEach(cfg => this.ytcfg = Object.assign(cfg, this.ytcfg));

                console.log('YT Music initialized');
            })
            .catch(err => console.error(err));
    }

    apiRequest(endpointName, body, query = {}) {
        const headers = {
            'x-origin': this.client.defaults.baseURL,
            'X-Goog-Visitor-Id': this.ytcfg.VISITOR_DATA,
            'X-YouTube-Client-Name': this.ytcfg.INNERTUBE_CONTEXT_CLIENT_NAME,
            'X-YouTube-Client-Version': this.ytcfg.INNERTUBE_CLIENT_VERSION,
            'X-YouTube-Device': this.ytcfg.DEVICE,
            'X-YouTube-Page-CL': this.ytcfg.PAGE_CL,
            'X-YouTube-Page-Label': this.ytcfg.PAGE_BUILD_LABEL,
            'X-YouTube-Utc-Offset': String(-new Date().getTimezoneOffset()),
            'X-YouTube-Time-Zone': new Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        const context = createApiContext(this.ytcfg);

        const params = {
            alt: 'json',
            key: this.ytcfg.INNERTUBE_API_KEY,
            ...query
        };

        return new Promise((resolve, reject) => {
            this.client.post(`/youtubei/${this.ytcfg.INNERTUBE_API_VERSION}${endpointName}`,
                {
                    context,
                    ...body
                },
                {
                    responseType: 'json',
                    headers,
                    params
                })
                .then(res => resolve(res.data))
                .catch(err => reject(err));
        });
    }

    async getSuggestions(input) {
        const data = await this.apiRequest('/music/get_search_suggestions', { input });
        return Parser.parseSuggestions(data);
    }

    async search(query, categoryName = null) {
        const data = await this.apiRequest('/search', { query, params: getCategoryURI(categoryName) });
        return Parser.parseSearch(data, categoryName);
    }

    async getSongInfo(videoId) {
        let data = await this.apiRequest('/next', { videoId });
        data = Parser.parseSong(data);
        data.id = videoId;
        return data;
    }

    async getArtist(browseId) {
        browseId = String(browseId);
        if (!browseId.startsWith('UC'))
            throw new Error('Invalid artist browse ID');
        let data = await this.apiRequest('/browse', createBrowseContext('ARTIST', browseId));
        data = Parser.parseArtist(data);
        data.id = browseId;
        return data;
    }

    async getAlbum(browseId) {
        browseId = String(browseId);
        if (!browseId.startsWith('MPREb'))
            throw new Error('Invalid album browse ID');
        let data = await this.apiRequest('/browse', createBrowseContext('ALBUM', browseId));
        data = Parser.parseAlbum(data);
        data.id = browseId;
        return data;
    }

    async getPlaylist(browseId) {
        browseId = String(browseId);
        if (!browseId)
            throw new Error('Invalid playlist browse ID');

        // Add VL to the start of browse ID
        !browseId.startsWith('VL') && (browseId = 'VL' + browseId);

        // Get initial playlist data
        let data = await this.apiRequest('/browse', createBrowseContext('PLAYLIST', browseId));
        const playlist = Parser.parsePlaylist(data);
        playlist.id = browseId;

        // Get continuations
        let continuationData = Parser.getPlaylistContinuation(data);
        while (!!continuationData) {

            data = await this.apiRequest('/browse', {}, {
                ctoken: continuationData.continuation,
                continuation: continuationData.continuation,
                itct: continuationData.clickTrackingParams
            });
            playlist.songs = playlist.songs.concat(Parser.parsePlaylistContents(data));

            continuationData = Parser.getPlaylistContinuation(data);

        }

        return playlist;
    }

}

const api = new YoutubeMusicAPI();
module.exports = api;

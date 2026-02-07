import axios from "axios"

const API_URL = 'http://127.0.0.1:8000'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

// ==============
// Quest
export const questsAPI = {

    // Criar nova
    create: async (title, description = '') => {
        const response = await api.post('/quests', { title, description })

        return response.data
    },

    // Listar todas
    getAll: async () => {
        const response = await api.get('/quests')

        return response.data
    },

    // Busca especifica
    getById: async (id) => {
        const response = await api.get(`/quests/${id}`)

        return response.data
    },

    // Stats
    getStats: async () => {
        const response = await api.get('/quests/stats')

        return response.data
    },

    // Att status
    updateStatus: async (id, status) => {
        const response = await api.patch(`/quests/${id}/status?status=${status}`)

        return response.data
    },

    // Deletar
    delete: async (id) => {
        const response = await api.delete(`/quests/${id}`)

        return response.data
    },

    // Playlist da quest
    getPlaylist: async (id) => {
        const response = await api.get(`/quests/${id}/playlist`)

        return response.data
    },

    // Alternar sync
    sync: async (id, isSyncing) => {
        const response = await api.post(`/quests/${id}/sync?is_syncing=${isSyncing}`)

        return response.data
    },

    // Atualizar dados da quest
    update: async (id, data) => {
        const response = await api.patch(`/quests/${id}`, data)

        return response.data
    },

    // Resgatar loot
    retrieveLoot: async (id) => {
        const response = await api.post(`/quests/${id}/retrieve_loot`)

        return response.data
    }

}

// ==============
// Checkpoints

export const checkpointsAPI = {

    // Buscar checkpoint completed de cada quest
    getByQuestId: async (questId) => {
        const response = await api.get(`/quests/${questId}/stats`)

        return response.data
    },

    // Criar checkpoint
    create: async (questId, title, orderIndex) => {
        const response = await api.post(`/quests/${questId}/checkpoints`, {
            title,
            order_index: orderIndex,
        })

        return response.data
    },

    // Marcar como completo
    complete: async (checkpointId) => {
        const response = await api.patch(`/checkpoints/${checkpointId}/complete`)

        return response.data
    },

    // Músicas do checkpoint
    getMusic: async (checkpoint_id) => {
        const response = await api.get(`/checkpoints/${checkpoint_id}/music`)

        return response.data
    },

    // Atualizar checkpoint
    update: async (id, data) => {
        const response = await api.patch(`/checkpoints/${id}`, data)
        
        return response.data
    },

    // Deletar checkpoint
    delete: async (id) => {
        const response = await api.delete(`/checkpoints/${id}`)

        return response.data
    },

    // Adicionar checkpoint a uma quest existente
    add: async (questId, title, orderIndex) => {
        const response = await api.post(`/checkpoints?quest_id=${questId}`, {
            title,
            order_index: orderIndex
        })

        return response.data
    },

}

// ==============
// Spotify

export const spotifyAPI = {

    // Status de autenticação
    getAuthStatus: async () => {
        const response = await api.get('/spotify/auth/status');
        return response.data;
    },

    getUserTier: async () => {
        const response = await api.get('/spotify/user-tier');
        return response.data;
    },

    // URL de login
    getLoginUrl: async () => {
        const response = await api.get('/spotify/auth/login')

        return response.data
    },

    // Logout
    logout: async () => {
        const response = await api.post('/spotify/auth/logout')
        return response.data
    },

    // Música atual
    getCurrentTrack: async () => {
        const response = await api.get('/spotify/current')

        return response.data
    },

    // Criar playlist
    createPlaylist: async (playlistName, trackUris) => {
        const response = await api.post('/spotify/create-playlist', {
            playlist_name: playlistName,
            track_uris: trackUris,
        })

        return response.data
    },

    play: async () => {
        const response = await api.post('/spotify/play')
        return response.data
    },

    pause: async () => {
        const response = await api.post('/spotify/pause')
        return response.data
    },

    next: async () => {
        const response = await api.post('/spotify/next')
        return response.data
    },

    previous: async () => {
        const response = await api.post('/spotify/previous')
        return response.data
    },

    volume: async (value) => {
        const response = await api.post(`/spotify/volume?volume=${value}`)
        return response.data
    },

    transferPlayback: async (deviceId) => {
        const response = await api.post(`/spotify/transfer-playback?device_id=${deviceId}`)
        return response.data
    },
}

// ==============
// Music track

export const musicAPI = {

    // Registrar música tocada
    track: async (requestData) => {
        const response = await api.post('/music/track', requestData)

        return response.data
    },

}

// ==============
// Health check

export const healthCheck = async () => {

    try {
        const response = await api.get('/health')

        return response.data

    } catch (error) {
        console.error('API não está respondendo:', error)

        return null;
    }

}

// ==============
// User Stats

export const userAPI = {
    getStats: async () => {
        const response = await api.get('/user/stats');

        return response.data;
    }
}

export default api






const DEFAULT_LAN_PORT = 3010;

function trimTrailingSlash (value)
{
    return String(value || '').replace(/\/+$/, '');
}

export function getConfiguredApiBaseUrl ()
{
    const raw = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_BASE_URL : '';
    const trimmed = String(raw || '').trim();

    if (!trimmed)
    {
        return null;
    }

    if (/^https?:\/\//i.test(trimmed))
    {
        return trimTrailingSlash(trimmed);
    }

    const protocol = (typeof window !== 'undefined' && window.location?.protocol === 'https:') ? 'https' : 'http';
    return trimTrailingSlash(`${protocol}://${trimmed}`);
}

export function getLanServerUrl (serverIp, port = DEFAULT_LAN_PORT)
{
    const configuredApiBase = getConfiguredApiBaseUrl();
    if (configuredApiBase)
    {
        return configuredApiBase;
    }

    const trimmed = String(serverIp || '').trim();
    if (!trimmed)
    {
        return `http://localhost:${port}`;
    }

    if (/^https?:\/\//i.test(trimmed))
    {
        return trimTrailingSlash(trimmed);
    }

    const locationProtocol = (typeof window !== 'undefined' && window.location?.protocol === 'https:') ? 'https' : 'http';
    return `${locationProtocol}://${trimmed}:${port}`;
}

export async function resolveLocalNetworkInfo (port = DEFAULT_LAN_PORT)
{
    const configuredApiBase = getConfiguredApiBaseUrl();

    if (configuredApiBase)
    {
        try
        {
            const response = await fetch(`${configuredApiBase}/api/network-info`);
            if (response.ok)
            {
                return await response.json();
            }
        }
        catch
        {
            // When a remote API URL is configured but unavailable, we still return a safe fallback.
        }
    }

    const locationHost = typeof window !== 'undefined' ? window.location.hostname : '';
    const directHost = locationHost && locationHost !== 'localhost' && locationHost !== '127.0.0.1'
        ? locationHost
        : '';

    try
    {
        const response = await fetch(`http://localhost:${port}/api/network-info`);
        if (response.ok)
        {
            return await response.json();
        }
    }
    catch
    {
        // Fallback keeps the setup UI usable when the LAN server is not running yet.
    }

    return {
        ip: directHost || '127.0.0.1',
        port,
        serverAvailable: false
    };
}

export class LanClient
{
    constructor ({ serverIp, port = DEFAULT_LAN_PORT, onOpen, onClose, onError, onMessage } = {})
    {
        this.serverIp = serverIp;
        this.port = port;
        this.onOpen = onOpen;
        this.onClose = onClose;
        this.onError = onError;
        this.onMessage = onMessage;
        this.connectionId = null;
        this.pollTimer = null;
        this.lastMatchNonce = 0;
        this.pollMode = 'lobby';
    }

    async request (path, options = {})
    {
        const response = await fetch(`${getLanServerUrl(this.serverIp, this.port)}${path}`, {
            headers: {
                'Content-Type': 'application/json'
            },
            ...options
        });

        if (!response.ok)
        {
            const payload = await response.json().catch(() => ({ message: 'Erreur reseau' }));
            throw new Error(payload.message || 'Erreur reseau');
        }

        return response.json();
    }

    async connect ()
    {
        const response = await this.request('/api/connect', {
            method: 'POST',
            body: JSON.stringify({})
        });

        this.connectionId = response.connectionId;
        this.onOpen?.();
        this.onMessage?.({ type: 'session:hello', payload: { connectionId: this.connectionId } });
        return response;
    }

    startPolling (intervalMs = 800, mode = 'lobby')
    {
        this.pollMode = mode;
        this.stopPolling();
        this.pollTimer = window.setInterval(async () => {
            try
            {
                const state = await this.request(`/api/state?connectionId=${encodeURIComponent(this.connectionId || '')}`);
                if (this.pollMode === 'lobby')
                {
                    this.onMessage?.({ type: 'lobby:state', payload: state.lobbyState });
                }

                if (state.matchState)
                {
                    this.onMessage?.({
                        type: 'match:state',
                        payload: {
                            matchState: state.matchState,
                            connectionView: state.connectionView || null
                        }
                    });
                }

                if (state.matchPayload && state.matchNonce > this.lastMatchNonce)
                {
                    this.lastMatchNonce = state.matchNonce;
                    this.onMessage?.({ type: 'match:started', payload: state.matchPayload });
                }
            }
            catch (error)
            {
                this.onError?.(error);
                this.stopPolling();
            }
        }, intervalMs);
    }

    stopPolling ()
    {
        if (this.pollTimer !== null)
        {
            window.clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }

    createLobby (config)
    {
        return this.request('/api/create-lobby', {
            method: 'POST',
            body: JSON.stringify({ connectionId: this.connectionId, config })
        });
    }

    joinLobby (config)
    {
        return this.request('/api/join-lobby', {
            method: 'POST',
            body: JSON.stringify({ connectionId: this.connectionId, config })
        });
    }

    updateLobbyOptions (options)
    {
        return this.request('/api/update-options', {
            method: 'POST',
            body: JSON.stringify({ connectionId: this.connectionId, options })
        });
    }

    sendChatMessage (message)
    {
        return this.request('/api/chat', {
            method: 'POST',
            body: JSON.stringify({ connectionId: this.connectionId, message })
        });
    }

    startMatch ()
    {
        return this.request('/api/start-match', {
            method: 'POST',
            body: JSON.stringify({ connectionId: this.connectionId })
        });
    }

    sendPlayerInput (inputProfile, direction)
    {
        return this.request('/api/input', {
            method: 'POST',
            body: JSON.stringify({
                connectionId: this.connectionId,
                inputProfile,
                direction
            })
        });
    }

    sendPlayerAction (inputProfile, action = 'primary')
    {
        return this.request('/api/action', {
            method: 'POST',
            body: JSON.stringify({
                connectionId: this.connectionId,
                inputProfile,
                action
            })
        });
    }

    disconnect ()
    {
        this.stopPolling();
        if (this.connectionId)
        {
            this.request('/api/disconnect', {
                method: 'POST',
                body: JSON.stringify({ connectionId: this.connectionId })
            }).catch(() => undefined);
        }

        this.connectionId = null;
        this.onClose?.();
    }
}
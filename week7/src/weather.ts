export type UnitSystem = 'metric' | 'imperial'

export type IconName =
    | 'clear'
    | 'mostly-clear'
    | 'partly-cloudy'
    | 'cloudy'
    | 'fog'
    | 'drizzle'
    | 'rain'
    | 'snow'
    | 'thunder'

export type Theme = 'clear' | 'night' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm'

export interface Place {
    name: string
    region?: string
    country?: string
    timezone: string
}

export interface Current {
    temperature: number
    feelsLike: number
    humidity: number
    precipitation: number
    windSpeed: number
    windDirection: number
    pressure: number
    uvIndex: number
    isDay: boolean
    code: number
    time: string
}

export interface Hour {
    time: string
    temperature: number
    precipProbability: number
    code: number
    isDay: boolean
}

export interface Today {
    high: number
    low: number
    sunrise: string
    sunset: string
}

export interface Forecast {
    place: Place
    current: Current
    hours: Hour[]
    today: Today
    units: UnitSystem
}

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

const UNIT_PARAMS: Record<UnitSystem, { temperature_unit: string; wind_speed_unit: string; precipitation_unit: string }> = {
    metric: { temperature_unit: 'celsius', wind_speed_unit: 'kmh', precipitation_unit: 'mm' },
    imperial: { temperature_unit: 'fahrenheit', wind_speed_unit: 'mph', precipitation_unit: 'inch' },
}

const getJson = async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error('The weather service is not responding. Try again in a moment.')
    return response.json()
}

interface GeoResult {
    name?: string
    latitude?: number
    longitude?: number
    country?: string
    admin1?: string
    timezone?: string
}

export const fetchForecast = async (city: string, units: UnitSystem): Promise<Forecast> => {
    const query = city.trim()
    if (!query) throw new Error('Type a city name first.')

    const geoUrl = `${GEO_URL}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
    const geo = (await getJson(geoUrl)) as { results?: GeoResult[] }
    const hit = geo.results?.[0]

    if (!hit?.latitude || !hit.longitude) {
        throw new Error(`No place called “${query}” was found. Check the spelling and try again.`)
    }

    const params = UNIT_PARAMS[units]
    const forecastUrl =
        `${FORECAST_URL}?latitude=${hit.latitude}&longitude=${hit.longitude}` +
        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,weather_code,is_day,pressure_msl,uv_index' +
        '&hourly=temperature_2m,precipitation_probability,weather_code,is_day' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset' +
        `&timezone=auto&forecast_days=2&temperature_unit=${params.temperature_unit}` +
        `&wind_speed_unit=${params.wind_speed_unit}&precipitation_unit=${params.precipitation_unit}`

    const data = await getJson(forecastUrl)

    const current = data.current
    const hourly = data.hourly
    const daily = data.daily

    const currentHour = String(current.time).slice(0, 13)
    const startIndex = Math.max(
        0,
        (hourly.time as string[]).findIndex((t: string) => t.slice(0, 13) === currentHour)
    )

    const hours: Hour[] = (hourly.time as string[])
        .slice(startIndex, startIndex + 12)
        .map((time: string, offset: number) => ({
            time,
            temperature: hourly.temperature_2m[startIndex + offset],
            precipProbability: hourly.precipitation_probability[startIndex + offset] ?? 0,
            code: hourly.weather_code[startIndex + offset],
            isDay: hourly.is_day[startIndex + offset] === 1,
        }))

    // The first card is labelled "Now", so anchor it on the current reading rather
    // than the top of the hour — otherwise it can disagree with the headline.
    if (hours.length > 0) {
        hours[0] = {
            time: current.time,
            temperature: current.temperature_2m,
            precipProbability: hours[0].precipProbability,
            code: current.weather_code,
            isDay: current.is_day === 1,
        }
    }

    const place: Place = {
        name: hit.name ?? query,
        region: hit.admin1,
        country: hit.country,
        timezone: data.timezone ?? hit.timezone ?? 'UTC',
    }

    return {
        place,
        units,
        current: {
            temperature: current.temperature_2m,
            feelsLike: current.apparent_temperature,
            humidity: current.relative_humidity_2m,
            precipitation: current.precipitation,
            windSpeed: current.wind_speed_10m,
            windDirection: current.wind_direction_10m,
            pressure: current.pressure_msl,
            uvIndex: current.uv_index,
            isDay: current.is_day === 1,
            code: current.weather_code,
            time: current.time,
        },
        hours,
        today: {
            high: Math.round(daily.temperature_2m_max[0]),
            low: Math.round(daily.temperature_2m_min[0]),
            sunrise: daily.sunrise[0],
            sunset: daily.sunset[0],
        },
    }
}

interface Descriptor {
    label: string
    icon: IconName
    theme: Theme
}

export const describe = (code: number, isDay: boolean): Descriptor => {
    const theme = (day: Theme, night: Theme) => (isDay ? day : night)

    switch (code) {
        case 0:
            return { label: 'Clear sky', icon: 'clear', theme: theme('clear', 'night') }
        case 1:
            return { label: 'Mainly clear', icon: 'mostly-clear', theme: theme('clear', 'night') }
        case 2:
            return { label: 'Partly cloudy', icon: 'partly-cloudy', theme: theme('partly', 'night') }
        case 3:
            return { label: 'Overcast', icon: 'cloudy', theme: 'cloudy' }
        case 45:
        case 48:
            return { label: 'Fog', icon: 'fog', theme: 'fog' }
        case 51:
        case 53:
        case 55:
        case 56:
        case 57:
            return { label: 'Drizzle', icon: 'drizzle', theme: 'drizzle' }
        case 61:
        case 63:
        case 65:
        case 66:
        case 67:
            return { label: 'Rain', icon: 'rain', theme: 'rain' }
        case 71:
        case 73:
        case 75:
        case 77:
            return { label: 'Snow', icon: 'snow', theme: 'snow' }
        case 80:
        case 81:
        case 82:
            return { label: 'Rain showers', icon: 'rain', theme: 'rain' }
        case 85:
        case 86:
            return { label: 'Snow showers', icon: 'snow', theme: 'snow' }
        case 95:
        case 96:
        case 99:
            return { label: 'Thunderstorm', icon: 'thunder', theme: 'storm' }
        default:
            return { label: 'Unknown', icon: 'cloudy', theme: 'cloudy' }
    }
}

/** Open-Meteo returns local wall-clock strings ("2026-01-05T14:00"), so slice instead of trusting Date parsing. */
export const formatHour = (iso: string): string => {
    const hour = Number(iso.slice(11, 13))
    const suffix = hour < 12 ? 'AM' : 'PM'
    const display = hour % 12 === 0 ? 12 : hour % 12
    return `${display}${suffix}`
}

export const formatClock = (iso: string): string => iso.slice(11, 16)

export const unitLabels = (units: UnitSystem) => ({
    temperature: units === 'metric' ? '°C' : '°F',
    wind: units === 'metric' ? 'km/h' : 'mph',
    precipitation: units === 'metric' ? 'mm' : 'in',
})

export const windDirectionLabel = (degrees: number): string => {
    const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    return points[Math.round(degrees / 45) % 8]
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { WeatherIcon } from './WeatherIcon'
import {
    describe,
    fetchForecast,
    formatClock,
    formatHour,
    unitLabels,
    windDirectionLabel,
    type Forecast,
    type UnitSystem
} from './weather'
import type { ReactNode } from 'react'

const SUGGESTIONS = ['Toronto', 'London', 'Tokyo', 'New York', 'Berlin']

type Status = 'idle' | 'loading' | 'ready' | 'error'

const SearchIcon = () => (
    <svg
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.7'
        strokeLinecap='round'
        aria-hidden='true'
    >
        <circle cx='10.8' cy='10.8' r='6.4' />
        <line x1='15.6' y1='15.6' x2='20.4' y2='20.4' />
    </svg>
)

const round = (value: number) => Math.round(value)

function App() {
    const [city, setCity] = useState('')
    const [query, setQuery] = useState('')
    const [units, setUnits] = useState<UnitSystem>('metric')
    const [status, setStatus] = useState<Status>('idle')
    const [forecast, setForecast] = useState<Forecast | null>(null)
    const [error, setError] = useState('')
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), 30_000)
        return () => window.clearInterval(id)
    }, [])

    const runSearch = useCallback(async (term: string, system: UnitSystem) => {
        const trimmed = term.trim()
        if (!trimmed) {
            setError('Type a city name first.')
            setStatus('error')
            return
        }

        setStatus('loading')
        setError('')

        try {
            setForecast(await fetchForecast(trimmed, system))
            setQuery(trimmed)
            setStatus('ready')
        } catch (cause) {
            setForecast(null)
            setError(cause instanceof Error ? cause.message : 'Something went wrong. Try again.')
            setStatus('error')
        }
    }, [])

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        void runSearch(city, units)
    }

    const handleUnitChange = (system: UnitSystem) => {
        if (system === units) return
        setUnits(system)
        if (query) void runSearch(query, system)
    }

    const unit = unitLabels(units)
    const condition = forecast ? describe(forecast.current.code, forecast.current.isDay) : null

    const localTime = useMemo(() => {
        if (!forecast) return null
        try {
            return new Intl.DateTimeFormat('en-US', {
                timeZone: forecast.place.timezone,
                hour: 'numeric',
                minute: '2-digit'
            }).format(new Date(now))
        } catch {
            return null
        }
    }, [forecast, now])

    return (
        <div className='app' data-theme={condition?.theme ?? 'night'}>
            <div className='shell'>
                <header className='masthead'>
                    <div className='brand'>
                        <span className='brand__mark' aria-hidden='true'>
                            <WeatherIcon name='partly-cloudy' />
                        </span>
                        <span className='brand__name'>Tav Weather App</span>
                    </div>

                    <div className='units' role='group' aria-label='Temperature unit'>
                        <button
                            type='button'
                            className='units__button'
                            aria-pressed={units === 'metric'}
                            onClick={() => handleUnitChange('metric')}
                        >
                            °C
                        </button>
                        <button
                            type='button'
                            className='units__button'
                            aria-pressed={units === 'imperial'}
                            onClick={() => handleUnitChange('imperial')}
                        >
                            °F
                        </button>
                    </div>
                </header>

                <form className='search' onSubmit={handleSubmit} role='search'>
                    <div className='search__field'>
                        <span className='search__icon' aria-hidden='true'>
                            <SearchIcon />
                        </span>
                        <input
                            className='search__input'
                            value={city}
                            onChange={event => setCity(event.target.value)}
                            placeholder='Search a city…'
                            aria-label='City name'
                            autoComplete='off'
                            spellCheck={false}
                        />
                    </div>
                    <button
                        className='search__submit'
                        type='submit'
                        disabled={status === 'loading'}
                    >
                        {status === 'loading' ? 'Searching' : 'Search'}
                    </button>
                </form>

                <main className='stage'>
                    {status === 'idle' && (
                        <section className='empty'>
                            <p className='empty__title'>Where are you looking up?</p>
                            <p className='empty__hint'>
                                Pick a city to see the current conditions and the next 12 hours.
                            </p>
                            <ul className='chips'>
                                {SUGGESTIONS.map(name => (
                                    <li key={name}>
                                        <button
                                            type='button'
                                            className='chip'
                                            onClick={() => {
                                                setCity(name)
                                                void runSearch(name, units)
                                            }}
                                        >
                                            {name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {status === 'loading' && (
                        <section
                            className='panel panel--skeleton'
                            aria-busy='true'
                            aria-label='Loading weather'
                        >
                            <div className='skeleton skeleton--line' />
                            <div className='skeleton skeleton--temp' />
                            <div className='skeleton skeleton--grid'>
                                <span />
                                <span />
                                <span />
                                <span />
                            </div>
                        </section>
                    )}

                    {status === 'error' && (
                        <section className='alert' role='alert'>
                            <p className='alert__title'>No forecast to show</p>
                            <p className='alert__message'>{error}</p>
                            {query && (
                                <button
                                    type='button'
                                    className='chip'
                                    onClick={() => void runSearch(query, units)}
                                >
                                    Try again
                                </button>
                            )}
                        </section>
                    )}

                    {status === 'ready' && forecast && condition && (
                        <article className='panel' aria-live='polite'>
                            <header className='panel__head'>
                                <div>
                                    <h1 className='place'>{forecast.place.name}</h1>
                                    <p className='place__meta'>
                                        {[forecast.place.region, forecast.place.country]
                                            .filter(Boolean)
                                            .join(', ')}
                                        {localTime ? ` · ${localTime} local` : ''}
                                    </p>
                                </div>
                                <WeatherIcon
                                    className='panel__glyph'
                                    name={condition.icon}
                                    title={condition.label}
                                />
                            </header>

                            <div className='hero'>
                                <p className='hero__temp'>
                                    {round(forecast.current.temperature)}
                                    <span className='hero__degree'>{unit.temperature}</span>
                                </p>
                                <div className='hero__summary'>
                                    <p className='hero__condition'>{condition.label}</p>
                                    <p className='hero__range'>
                                        Feels like {round(forecast.current.feelsLike)}
                                        {unit.temperature} · H {forecast.today.high}° L{' '}
                                        {forecast.today.low}°
                                    </p>
                                </div>
                            </div>

                            <dl className='stats'>
                                <Stat
                                    label='Humidity'
                                    value={`${round(forecast.current.humidity)}%`}
                                />
                                <Stat
                                    label='Wind'
                                    value={`${round(forecast.current.windSpeed)} ${unit.wind}`}
                                    hint={windDirectionLabel(forecast.current.windDirection)}
                                />
                                <Stat
                                    label='Precipitation'
                                    value={`${forecast.current.precipitation} ${unit.precipitation}`}
                                />
                                <Stat
                                    label='UV index'
                                    value={`${Math.round(forecast.current.uvIndex)}`}
                                />
                            </dl>

                            <section className='hours' aria-label='Next 12 hours'>
                                <h2 className='hours__title'>
                                    Next 12 hours
                                    <span className='hours__note'>precip chance</span>
                                </h2>
                                <ul className='hours__list'>
                                    {forecast.hours.map((hour, index) => {
                                        const hourCondition = describe(hour.code, hour.isDay)
                                        return (
                                            <li
                                                className='hour'
                                                key={hour.time}
                                                aria-label={`${formatHour(hour.time)}: ${hourCondition.label}, ${round(hour.temperature)} degrees, ${round(hour.precipProbability)}% chance of precipitation`}
                                            >
                                                <span className='hour__time'>
                                                    {index === 0 ? 'Now' : formatHour(hour.time)}
                                                </span>
                                                <WeatherIcon
                                                    className='hour__icon'
                                                    name={hourCondition.icon}
                                                />
                                                <span className='hour__temp'>
                                                    {round(hour.temperature)}°
                                                </span>
                                                <span className='hour__rain'>
                                                    {round(hour.precipProbability)}%
                                                </span>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </section>

                            <footer className='panel__foot'>
                                <span>Sunrise {formatClock(forecast.today.sunrise)}</span>
                                <span>Sunset {formatClock(forecast.today.sunset)}</span>
                            </footer>
                        </article>
                    )}
                </main>
            </div>
        </div>
    )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: ReactNode }) {
    return (
        <div className='stat'>
            <dt className='stat__label'>{label}</dt>
            <dd className='stat__value'>
                {value}
                {hint ? <span className='stat__hint'>{hint}</span> : null}
            </dd>
        </div>
    )
}

export default App

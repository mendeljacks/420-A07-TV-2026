import type { ReactNode } from 'react'
import type { IconName } from './weather'

/**
 * Tiny hand-drawn weather icon set. Strokes use currentColor so the icons
 * inherit whatever the surrounding theme gives them.
 */
const PATHS: Record<IconName, ReactNode> = {
    clear: (
        <>
            <circle cx="12" cy="12" r="4.6" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                <line
                    key={angle}
                    x1="12"
                    y1="2.6"
                    x2="12"
                    y2="5.1"
                    transform={`rotate(${angle} 12 12)`}
                />
            ))}
        </>
    ),
    'mostly-clear': (
        <>
            <circle cx="9.4" cy="9.4" r="3.3" />
            {[0, 60, 120, 180, 240, 300].map(angle => (
                <line key={angle} x1="9.4" y1="2.6" x2="9.4" y2="3.9" transform={`rotate(${angle} 9.4 9.4)`} />
            ))}
            <path d="M10.5 20.4h7a3.1 3.1 0 0 0 .4-6.17 4.4 4.4 0 0 0-8.3-.9 3.5 3.5 0 0 0 .9 7.07Z" />
        </>
    ),
    'partly-cloudy': (
        <>
            <circle cx="8.6" cy="8.2" r="3" />
            <path d="M9.2 20.4h8.2a3.3 3.3 0 0 0 .5-6.55 4.7 4.7 0 0 0-8.9-1A3.75 3.75 0 0 0 9.2 20.4Z" />
        </>
    ),
    cloudy: <path d="M7.2 19.6h9.4a3.7 3.7 0 0 0 .6-7.35 5.3 5.3 0 0 0-10-1.1A4.15 4.15 0 0 0 7.2 19.6Z" />,
    fog: (
        <>
            <path d="M7.2 15h9.4a3.7 3.7 0 0 0 .6-7.35 5.3 5.3 0 0 0-10-1.1A4.15 4.15 0 0 0 7.2 15Z" />
            <line x1="5" y1="18.2" x2="19" y2="18.2" />
            <line x1="7" y1="21" x2="17" y2="21" />
        </>
    ),
    drizzle: (
        <>
            <path d="M7.2 15.4h9.4a3.7 3.7 0 0 0 .6-7.35 5.3 5.3 0 0 0-10-1.1A4.15 4.15 0 0 0 7.2 15.4Z" />
            <line x1="9" y1="18.4" x2="8.2" y2="20.6" />
            <line x1="12.4" y1="18.4" x2="11.6" y2="20.6" />
            <line x1="15.8" y1="18.4" x2="15" y2="20.6" />
        </>
    ),
    rain: (
        <>
            <path d="M7.2 15.4h9.4a3.7 3.7 0 0 0 .6-7.35 5.3 5.3 0 0 0-10-1.1A4.15 4.15 0 0 0 7.2 15.4Z" />
            <line x1="8.8" y1="17.8" x2="7.4" y2="21.4" />
            <line x1="12.4" y1="17.8" x2="11" y2="21.4" />
            <line x1="16" y1="17.8" x2="14.6" y2="21.4" />
        </>
    ),
    snow: (
        <>
            <path d="M7.2 15h9.4a3.7 3.7 0 0 0 .6-7.35 5.3 5.3 0 0 0-10-1.1A4.15 4.15 0 0 0 7.2 15Z" />
            <circle cx="9" cy="18.4" r="1" />
            <circle cx="12.4" cy="20.4" r="1" />
            <circle cx="15.8" cy="18.4" r="1" />
        </>
    ),
    thunder: (
        <>
            <path d="M7.2 14.6h9.4a3.7 3.7 0 0 0 .6-7.35 5.3 5.3 0 0 0-10-1.1A4.15 4.15 0 0 0 7.2 14.6Z" />
            <path d="M12.9 16.4h-2.6l-1.2 3.1h2l-1 3.1 4.3-4.4h-2.2l1.6-1.8Z" />
        </>
    ),
}

interface Props {
    name: IconName
    className?: string
    title?: string
}

export function WeatherIcon({ name, className, title }: Props) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            role={title ? 'img' : 'presentation'}
            aria-hidden={title ? undefined : true}
        >
            {title ? <title>{title}</title> : null}
            {PATHS[name]}
        </svg>
    )
}

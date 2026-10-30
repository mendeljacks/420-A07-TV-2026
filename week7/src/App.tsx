import { useState } from 'react'

const doSearch = async (city: string) => {
    const request_url = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`

    const coordinates = await (await fetch(request_url)).json()

    const { longitude, latitude, timezone } = coordinates.results?.[0]

    const weather_request_url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&timezone=${timezone}&forecast_days=1`

    const result = await (await fetch(weather_request_url)).json()
    return result
}

function App() {
    const [city, setCity] = useState('')

    const [weather, setWeather] = useState()

    return (
        <>
            <input onChange={e => setCity(e.target.value)}></input>
            <button onClick={async () => setWeather(await doSearch(city))}>Search</button>

            <p>The weather is:</p>
            <pre>{JSON.stringify(weather, null, 2)}</pre>
        </>
    )
}

export default App

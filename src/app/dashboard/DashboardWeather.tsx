"use client";

import { useEffect, useState } from "react";
import {
  SunIcon,
  CloudIcon,
  CloudArrowDownIcon,
  BoltIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1/search";

type WeatherState = {
  temp: number;
  weatherCode: number;
  windSpeed: number;
  windDir: number;
  label: string;
} | null;

function windDirection(deg: number): string {
  const dirs = ["N", "NO", "O", "SO", "S", "SV", "V", "NV"];
  const i = Math.round(((deg % 360) / 45)) % 8;
  return dirs[i] ?? "—";
}

function weatherLabel(code: number): string {
  if (code === 0) return "Klart";
  if (code <= 3) return "Moln";
  if (code <= 49) return "Dimma";
  if (code <= 59) return "Duggregn";
  if (code <= 69) return "Regn";
  if (code <= 79) return "Snö";
  if (code <= 84) return "Byar";
  if (code <= 94) return "Åska";
  return "Variabelt";
}

function WeatherIcon({
  code,
  className,
}: {
  code: number;
  className?: string;
}) {
  if (code === 0) return <SunIcon className={className} aria-hidden />;
  if (code <= 3) return <CloudIcon className={className} aria-hidden />;
  if (code <= 49) return <CloudIcon className={className} aria-hidden />;
  if (code <= 69) return <CloudArrowDownIcon className={className} aria-hidden />;
  if (code <= 79) return <CloudIcon className={className} aria-hidden />;
  if (code <= 94) return <BoltIcon className={className} aria-hidden />;
  return <CloudIcon className={className} aria-hidden />;
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherState> {
  const url = `${OPEN_METEO_BASE}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const c = data?.current;
  if (!c) return null;
  return {
    temp: c.temperature_2m ?? 0,
    weatherCode: c.weather_code ?? 0,
    windSpeed: c.wind_speed_10m ?? 0,
    windDir: c.wind_direction_10m ?? 0,
    label: weatherLabel(c.weather_code ?? 0),
  };
}

async function geocodeCity(city: string): Promise<{ lat: number; lon: number } | null> {
  const url = `${GEOCODING_BASE}?name=${encodeURIComponent(city)}&count=1&language=sv`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const first = data?.results?.[0];
  if (first?.latitude == null || first?.longitude == null) return null;
  return { lat: first.latitude, lon: first.longitude };
}

type Props = { userCity?: string | null };

export default function DashboardWeather({ userCity }: Props) {
  const [weather, setWeather] = useState<WeatherState>(null);
  const [loading, setLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setWeather(null);
      setLocationLabel(null);

      const tryPosition = (): Promise<{ lat: number; lon: number } | null> =>
        new Promise((resolve) => {
          if (!navigator?.geolocation) {
            resolve(null);
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => resolve(null),
            { maximumAge: 600000, timeout: 10000 }
          );
        });

      const coords = await tryPosition();
      if (cancelled) return;

      if (coords) {
        setLocationLabel("Din position");
        const w = await fetchWeather(coords.lat, coords.lon);
        if (!cancelled) setWeather(w);
        setLoading(false);
        return;
      }

      const city = userCity?.trim();
      if (city) {
        const geo = await geocodeCity(city);
        if (cancelled) return;
        if (geo) {
          setLocationLabel(city);
          const w = await fetchWeather(geo.lat, geo.lon);
          if (!cancelled) setWeather(w);
        }
      }

      setLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [userCity]);

  if (loading) {
    return (
      <p className="text-xs md:text-sm text-stone-400 drop-shadow-md mt-1">
        Hämtar väder…
      </p>
    );
  }

  if (!weather) {
    return null;
  }

  const windStr = `${Math.round(weather.windSpeed)} km/h ${windDirection(weather.windDir)}`;

  return (
    <div
      className="text-stone-200 drop-shadow-md mt-0.5 md:mt-1"
      title={locationLabel ?? undefined}
    >
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] md:text-sm md:gap-x-2">
        <WeatherIcon code={weather.weatherCode} className="h-3 w-3 md:h-5 md:w-5 text-amber-300 shrink-0" />
        <span>{weather.label}</span>
        <span>{Math.round(weather.temp)} °C</span>
        <ArrowPathIcon className="h-3 w-3 md:h-5 md:w-5 text-stone-400 shrink-0" aria-hidden />
        <span>Vind {windStr}</span>
      </p>
    </div>
  );
}

# Remember Me as a Time of Day

A small WebGL installation that turns the current local time into a slowly changing sky gradient.

The page uses the browser's timezone, so the colors follow the time where you are. It also checks daylight saving time and adjusts the palette. The favicon uses the same colors as the WebGL frame.

## Run locally

```bash
npm run dev
```

Then open the local URL shown in the terminal.

## Built with

- WebGL and a fragment shader
- Vanilla JavaScript
- Tailwind CSS via CDN

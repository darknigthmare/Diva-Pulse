#!/bin/sh
cd -- "$(dirname -- "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then
    python3 lancer.py
else
    printf '%s\n' 'Python 3 est requis pour ce lanceur.' 'Vous pouvez aussi ouvrir DIVA_PULSE_JOUER.html directement.'
fi

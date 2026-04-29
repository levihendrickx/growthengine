# OmegaClaw on Windows — Setup Notes

This folder is set up to run **OmegaClaw-Core** on top of **PeTTa** natively
on Windows. The contents of this folder are the cloned PeTTa repo, with
OmegaClaw-Core and petta_lib_chromadb placed under `repos/` exactly as the
upstream README describes.

## What is in this folder

```
D:\mubashir\OMEGACLAW\
├── repos\
│   ├── OmegaClaw-Core\         # https://github.com/asi-alliance/OmegaClaw-Core
│   └── petta_lib_chromadb\     # https://github.com/patham9/petta_lib_chromadb
├── src\                        # PeTTa Prolog sources
├── lib\                        # PeTTa MeTTa stdlib
├── examples\                   # PeTTa examples
├── python\                     # PeTTa Python interop
├── run.metta                   # copied from repos/OmegaClaw-Core (entrypoint)
├── run.sh                      # original Linux/macOS launcher
├── run.bat                     # Windows launcher (added)
├── setup.bat                   # Windows env setup (added)
└── SETUP.md                    # this file
```

## One-time Windows prerequisites

These have to be installed by you on the Windows host — Cowork can't do it.

1. **Python 3.10+** — https://www.python.org/downloads/
   During install, tick *"Add python.exe to PATH"*.
2. **SWI-Prolog 9.1.12 or later** — https://www.swi-prolog.org/download/stable
   The installer adds `swipl.exe` to PATH by default.
3. **Git** (only needed if you want to pull updates) — https://git-scm.com/

Confirm each is on PATH from a fresh `cmd`:

```cmd
python --version
swipl --version
git --version
```

## Configure your OpenAI API key

You picked OpenAI as the LLM provider. Set the key once, persistently:

```cmd
setx OPENAI_API_KEY "sk-...your-key..."
```

Close and reopen `cmd` after `setx` so the new variable is visible.

## Install Python dependencies

From a fresh `cmd` opened in this folder:

```cmd
cd /d D:\mubashir\OMEGACLAW
setup.bat
```

`setup.bat` will:

1. Create a virtual environment in `.venv\`.
2. Install the CPU build of PyTorch (skip this manually if you want GPU torch).
3. Install everything in `repos\OmegaClaw-Core\requirements.txt`
   (sentence-transformers, chromadb, janus-swi, openai, uagents).

## Run the agent

Open `run.bat` and edit the two USER CONFIG values near the top:

- `IRC_CHANNEL` — a QuakeNet channel name, e.g. `#my_omegaclaw`.
- `OMEGACLAW_AUTH_SECRET` — any string; you'll send `auth <secret>` to the
  bot in IRC to claim ownership.

Then:

```cmd
cd /d D:\mubashir\OMEGACLAW
run.bat
```

In your browser, open https://webchat.quakenet.org/ , join the same channel
you set in `IRC_CHANNEL`, wait for the bot to join, and send:

```
auth <your OMEGACLAW_AUTH_SECRET>
```

The bot will then accept commands from you.

## Switching LLM provider later

`run.bat` passes `provider=OpenAI`. To switch:

| Provider  | Edit `run.bat`         | Set this env var      |
|-----------|------------------------|-----------------------|
| OpenAI    | `provider=OpenAI`      | `OPENAI_API_KEY`      |
| Anthropic | `provider=Anthropic`   | `ANTHROPIC_API_KEY`   |
| ASICloud  | `provider=ASICloud`    | `ASI_API_KEY`         |

For Anthropic you'll also need `pip install anthropic` inside `.venv`.

## Embeddings

By default `run.bat` uses `embeddingprovider=Local` (sentence-transformers).
If you'd rather use OpenAI's embedding API, change it to
`embeddingprovider=OpenAI` — `OPENAI_API_KEY` is reused.

## Troubleshooting

- **`swipl: command not found`** — re-install SWI-Prolog with the *Add to
  PATH* option, then reopen `cmd`.
- **`janus-swi` import errors** — janus-swi requires that the `swipl` you
  installed exposes the embedded Python bridge. Use the official SWI-Prolog
  9.2.x stable installer; the bundled `janus` library should work out of
  the box.
- **`Unknown procedure: janus:py_call/3` (with `py_call/4` suggested)** —
  Your SWI-Prolog has a janus library whose API doesn't match what PeTTa
  expects. PeTTa calls `py_call/3` (the standard janus interface); your
  installed janus only exposes `py_call/4`. Run `diag.bat` from this folder
  to see your `swipl --version` and the list of janus exports. The fix is
  almost always to install **SWI-Prolog 9.2.x stable** from
  https://www.swi-prolog.org/download/stable (uninstall the current one
  first if it's a development build or older than 9.1.12). After
  reinstalling, reopen `cmd` and rerun `run.bat`.
- **`OPENAI_API_KEY is not set`** — `setx` only affects *new* shells. Open
  a fresh `cmd` after running `setx`.
- **Long-path issues on Windows** — Some pip installs trip over the legacy
  260-character path limit. Enable long paths once via PowerShell as admin:
  `New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force`
- **Pulling updates** — `cd` into `repos\OmegaClaw-Core` (or the others) and
  `git pull`. The PeTTa root itself is also a git checkout.

## Optional: MORK / FAISS speedups

PeTTa's `build.sh` will fetch and compile `mork_ffi` and `faiss_ffi` for
faster atom spaces. That build path is Linux-first; on native Windows it
typically requires a C/Rust toolchain and isn't required to run OmegaClaw.
Skip unless you specifically need it.

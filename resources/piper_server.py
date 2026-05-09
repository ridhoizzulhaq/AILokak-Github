import sys, os, wave, io, struct

model_path = os.environ.get('PIPER_MODEL', '')
if not model_path:
    print('ERROR: PIPER_MODEL env not set', file=sys.stderr, flush=True)
    sys.exit(1)

from piper import PiperVoice
voice = PiperVoice.load(model_path)
print('READY', file=sys.stderr, flush=True)

for line in sys.stdin:
    text = line.strip().replace('\n', ' ').replace('\r', ' ')
    if not text:
        continue

    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(voice.config.sample_rate)
        for chunk in voice.synthesize(text):
            wf.writeframes(chunk.audio_int16_bytes)

    data = buf.getvalue()
    sys.stdout.buffer.write(struct.pack('<I', len(data)))
    sys.stdout.buffer.write(data)
    sys.stdout.buffer.flush()

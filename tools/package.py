"""Build an offline, single-file copy of चरी उड."""
import re
from pathlib import Path

project = Path(__file__).resolve().parents[1]
dist = project / "dist"
html = (dist / "index.html").read_text()
css = (dist / "style.css").read_text()

def source(name):
    text = (dist / f"{name}.js").read_text()
    return re.sub(r"^import .*?;\n", "", text, flags=re.MULTILINE).replace("export ", "")

def module(name, entry):
    return f"const {entry} = (() => {{\n{source(name)}\nreturn {entry};\n}})();"

script = "\n".join((
    source("districts"),
    module("landmarks", "makeLandmarks"),
    module("scenery", "makeScenery"),
    module("audio", "makeAudio"),
    module("profile", "makeProfile"),
    source("game"),
))
html = re.sub(r'<link rel="stylesheet" href="style\.css[^"]*">', lambda _: f"<style>\n{css}\n</style>", html)
html = re.sub(
    r'<script type="module" src="game\.js[^"]*"></script>',
    lambda _: f'<script type="module">\n{script}\n</script>',
    html,
)
(project / "Skywake.html").write_text(html)

"""Create a compact ODbL road extract from BBBike's NewDelhi OSM PBF download."""
import json
import pathlib
import sys

import osmium

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = pathlib.Path(sys.argv[1])
HIGHWAYS = {
    "motorway", "motorway_link", "trunk", "trunk_link", "primary", "primary_link",
    "secondary", "secondary_link", "tertiary", "tertiary_link",
}


class DelhiExtract(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.elements = []

    def way(self, way):
        tags = dict(way.tags)
        if not (
            tags.get("highway") in HIGHWAYS
            or tags.get("waterway") == "river"
            or tags.get("natural") == "water"
            or tags.get("leisure") == "park"
        ):
            return
        if not all(node.location.valid() for node in way.nodes):
            return
        geometry = [{"lat": node.lat, "lon": node.lon} for node in way.nodes]
        if not any(28.49 <= p["lat"] <= 28.76 and 77.06 <= p["lon"] <= 77.34 for p in geometry):
            return
        self.elements.append({
            "type": "way", "id": way.id, "nodes": [node.ref for node in way.nodes],
            "tags": tags, "geometry": geometry,
        })


with osmium.io.Reader(str(SOURCE)) as reader:
    timestamp = reader.header().get("osmosis_replication_timestamp")

handler = DelhiExtract()
handler.apply_file(str(SOURCE), locations=True)
output = {
    "version": 0.6,
    "generator": "INDR EV Delhi extract from BBBike / OpenStreetMap",
    "osm3s": {"timestamp_osm_base": timestamp},
    "copyright": "Map data (c) OpenStreetMap contributors; ODbL 1.0",
    "source": "https://download.bbbike.org/osm/bbbike/NewDelhi/",
    "elements": handler.elements,
}
target = ROOT / "assets" / "map" / "delhi-source.json"
target.write_text(json.dumps(output, separators=(",", ":")), encoding="utf-8")
print(f"Extracted {len(handler.elements)} ways, {target.stat().st_size:,} bytes, OSM timestamp {timestamp}")

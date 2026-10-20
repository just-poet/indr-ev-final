# Delhi Map Data And Attribution

Map data copyright OpenStreetMap contributors, available under the Open Data
Commons Open Database License (ODbL) 1.0:

- https://www.openstreetmap.org/copyright
- https://opendatacommons.org/licenses/odbl/1-0/

The source is a geographic subset of the NewDelhi extract provided by BBBike:
https://download.bbbike.org/osm/bbbike/NewDelhi/

`delhi-source.json` is the bundled source database for the background map and is
distributed under ODbL 1.0. It contains the road nodes, tags, water and park
geometry used by `scripts/build-delhi-map.cjs`. Its `osm3s` field records the
source data timestamp. `delhi-roads.svg` is a produced map rendered from that
database. The attribution link is always displayed on the website.

Cars are illustrative animation, not real vehicles, live traffic, navigation
instructions or a statement about charging-station availability. The animation
follows connected OSM road edges; it is not a turn-restriction routing engine.

The map, geometry, car artwork and animation are served from this repository.
There are no runtime tile, geocoding or routing API requests, expiring tokens,
paid map plans or map-vendor scripts.

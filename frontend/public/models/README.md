# 3D Models

Drop `.glb` files here. Anything placed in this folder is served directly at
`/models/<filename>.glb` by Vite (both in dev and in the production build).

To use one for a vehicle:
1. Put the file here, e.g. `frontend/public/models/supra.glb`
2. In the Configurator's Customize tab, set "Model file path" to `/models/supra.glb`

If the field is left blank, or the file fails to load, the vehicle falls back
to the generic procedural shape automatically.

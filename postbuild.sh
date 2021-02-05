#!/bin/sh

echo '#!/usr/bin/env node' > ./bin/json-class-to-ts
cat ./bin/json-class-to-ts.js >> ./bin/json-class-to-ts
chmod +x ./bin/json-class-to-ts


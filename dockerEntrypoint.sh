#!/bin/sh
echo '---- Starting Server ----'
node --max-http-header-size=16384 -r dotenv/config build
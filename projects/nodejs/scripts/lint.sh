#!/bin/bash
set -e

tslint -c ../../tslint.json 'e2e/**/*.ts' 'src/**/*.ts'

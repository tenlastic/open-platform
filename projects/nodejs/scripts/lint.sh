#!/bin/bash
set -e

tslint -c ../../tslint.json 'src/**/*.ts'

#!/bin/bash
set -e

case $(git log -1 --pretty=%B) in 
  *\[skip\]*)
    echo "true" ;;
  *)
    echo "false";; 
esac
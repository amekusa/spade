#!/usr/bin/env bash
cd "$(dirname $0)"
ver="$1"

_die() {
	[ -z "$1" ] || echo "$1" >&2
	exit 1
}

if [ -z "$ver" ]; then
	npm pkg get boilerplate.version
	exit
fi

npm pkg set boilerplate.version=$ver || _die
git add "package.json" || _die
git commit -m "v$ver" || _die
git tag v$ver || _die


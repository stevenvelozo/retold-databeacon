#!/usr/bin/env bash
#
# Build the retold-databeacon Docker image and export it as a gzipped tarball
# you can scp to any host with Docker installed. On success, prints a block
# of copy-paste deployment commands (including scp + docker load + docker run).
#
# Usage:
#   ./scripts/docker-package.sh                    # build, save, gzip
#   ./scripts/docker-package.sh --skip-build       # skip docker build (use existing image)
#   ./scripts/docker-package.sh --tag v1.2.3       # override the image tag
#
# Output:
#   dist/docker/retold-databeacon-<version>.docker.tar.gz
#
set -euo pipefail

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

# ---------------------------------------------------------------------------
# Args
# ---------------------------------------------------------------------------
SKIP_BUILD=0
TAG_OVERRIDE=""
while [[ $# -gt 0 ]]; do
	case "$1" in
		--skip-build)
			SKIP_BUILD=1
			shift
			;;
		--tag)
			TAG_OVERRIDE="$2"
			shift 2
			;;
		-h|--help)
			grep '^#' "$0" | sed 's/^# \{0,1\}//'
			exit 0
			;;
		*)
			echo "Unknown option: $1" >&2
			exit 1
			;;
	esac
done

# ---------------------------------------------------------------------------
# Derive names/tags from package.json
# ---------------------------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
	echo "ERROR: node is required to read package.json" >&2
	exit 1
fi
if ! command -v docker >/dev/null 2>&1; then
	echo "ERROR: docker is required" >&2
	exit 1
fi

PKG_NAME="$(node -p "require('./package.json').name")"
PKG_VERSION="${TAG_OVERRIDE:-$(node -p "require('./package.json').version")}"
IMAGE_TAG="${PKG_NAME}:${PKG_VERSION}"
IMAGE_TAG_LATEST="${PKG_NAME}:latest"
OUTPUT_DIR="${REPO_ROOT}/dist/docker"
OUTPUT_BASENAME="${PKG_NAME}-${PKG_VERSION}.docker"
OUTPUT_TAR="${OUTPUT_DIR}/${OUTPUT_BASENAME}.tar"
OUTPUT_GZ="${OUTPUT_DIR}/${OUTPUT_BASENAME}.tar.gz"

mkdir -p "${OUTPUT_DIR}"

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
if [[ "${SKIP_BUILD}" -eq 0 ]]; then
	echo "==> Building Docker image ${IMAGE_TAG}"
	docker build \
		--tag "${IMAGE_TAG}" \
		--tag "${IMAGE_TAG_LATEST}" \
		.
else
	echo "==> Skipping docker build (--skip-build). Using existing image ${IMAGE_TAG}."
	if ! docker image inspect "${IMAGE_TAG}" >/dev/null 2>&1; then
		echo "ERROR: image ${IMAGE_TAG} does not exist locally. Run without --skip-build first." >&2
		exit 1
	fi
fi

# ---------------------------------------------------------------------------
# Save + gzip
# ---------------------------------------------------------------------------
echo "==> Saving image to ${OUTPUT_TAR}"
rm -f "${OUTPUT_TAR}" "${OUTPUT_GZ}"
docker save "${IMAGE_TAG}" -o "${OUTPUT_TAR}"

echo "==> Compressing with gzip -9 → ${OUTPUT_GZ}"
gzip -9 -f "${OUTPUT_TAR}"

# ---------------------------------------------------------------------------
# Metadata
# ---------------------------------------------------------------------------
if command -v shasum >/dev/null 2>&1; then
	SHA256="$(shasum -a 256 "${OUTPUT_GZ}" | awk '{print $1}')"
elif command -v sha256sum >/dev/null 2>&1; then
	SHA256="$(sha256sum "${OUTPUT_GZ}" | awk '{print $1}')"
else
	SHA256="(shasum / sha256sum not found)"
fi

FILE_SIZE="$(du -h "${OUTPUT_GZ}" | cut -f1)"
RELATIVE_GZ="${OUTPUT_GZ#${REPO_ROOT}/}"

# ---------------------------------------------------------------------------
# Deployment boilerplate
# ---------------------------------------------------------------------------
cat <<BANNER

==========================================================================
  retold-databeacon Docker image packaged
--------------------------------------------------------------------------
  File:    ${RELATIVE_GZ}
  Size:    ${FILE_SIZE}
  Tag:     ${IMAGE_TAG}
  SHA-256: ${SHA256}
==========================================================================

### Upload to a server
Copy-paste (replace <user> and <host>):

    scp "${OUTPUT_GZ}" <user>@<host>:~/

Or scp to a specific target directory:

    ssh <user>@<host> 'mkdir -p /srv/retold-databeacon && sudo chown \$USER /srv/retold-databeacon'
    scp "${OUTPUT_GZ}" <user>@<host>:/srv/retold-databeacon/

### Load + run on the server
SSH in and import the image, then start the container:

    ssh <user>@<host>
    gunzip -c ~/${OUTPUT_BASENAME}.tar.gz | docker load
    docker run -d \\
        --name retold-databeacon \\
        --restart unless-stopped \\
        -p 8389:8389 \\
        -v /srv/retold-databeacon/data:/app/data \\
        ${IMAGE_TAG}

Tail the logs:

    docker logs -f retold-databeacon

### Update an existing deployment
Repeat the scp + docker load steps with the new tarball, then:

    docker stop retold-databeacon && docker rm retold-databeacon
    docker run -d \\
        --name retold-databeacon \\
        --restart unless-stopped \\
        -p 8389:8389 \\
        -v /srv/retold-databeacon/data:/app/data \\
        ${IMAGE_TAG}

### Verify integrity (optional, on the server)

    shasum -a 256 ~/${OUTPUT_BASENAME}.tar.gz
    # expected: ${SHA256}

==========================================================================
BANNER

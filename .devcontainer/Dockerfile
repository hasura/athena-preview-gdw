# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.202.3/containers/codespaces-linux/.devcontainer/base.Dockerfile

FROM mcr.microsoft.com/vscode/devcontainers/universal:1-focal

# ** [Optional] Uncomment this section to install additional packages. **
USER root

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
  && apt-get -y install --no-install-recommends \
  gnupg2 curl apt-transport-https \
  && curl -s https://packages.microsoft.com/config/debian/9/prod.list > /etc/apt/sources.list.d/mssql-release.list \
  && curl -s https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
  && apt-get update \
  && ACCEPT_EULA=Y apt-get -y install --no-install-recommends \
  ca-certificates libkrb5-3 libpq5 libnuma1 unixodbc-dev msodbcsql17 default-libmysqlclient-dev default-mysql-client libmariadb-dev

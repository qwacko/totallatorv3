
##### BUILDER
FROM node:20-bookworm


ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

ARG USER_HOME=/home/${USER}

WORKDIR /app
RUN apt-get update  \
    && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    git \
    sudo \
    vim \
    wget \
    make \
    g++ \
    gnupg \
    build-essential \
    lsb-release \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN yarn global add pnpm

RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME --shell /bin/bash \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME


USER ${USER}
WORKDIR ${USER_HOME}

EXPOSE 3000
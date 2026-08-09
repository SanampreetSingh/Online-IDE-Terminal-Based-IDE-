FROM node:22-slim


# 1. Install essential development tools + Process & Debug tools
RUN apt-get update && apt-get install -y \
    tini \
    build-essential \
    cmake \
    gdb \
    python3 \
    python3-pip \
    git \
    bash \
    curl \
    procps \
    vim \
    nano \
    sudo \
    && apt-get clean && rm -rf /var/lib/apt/lists/*


# 2. Setup the User with a defined UID
RUN useradd -m -u 1001 -s /bin/bash codeuser && \
    echo "codeuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# 3. Prevent Git "Dubious Ownership" errors on host-mounted volumes
RUN git config --global safe.directory '*'


# 4. Create the 'serve-link' utility script
RUN echo '#!/bin/bash\n\
PORT=$1\n\
PATH_SUFFIX=$2\n\
if [ -z "$PORT" ]; then\n\
  echo -e "\\e[1;31mError: Please provide a port (e.g., serve-link 3000)\\e[0m"\n\
  exit 1\n\
fi\n\
[[ "$PATH_SUFFIX" != /* && ! -z "$PATH_SUFFIX" ]] && PATH_SUFFIX="/$PATH_SUFFIX"\n\
echo -e "\\n\\e[1;32m🚀 PREVIEW ACTIVE\\e[0m"\n\
echo -e "\\e[1;34m🔗 Click here:\\e[0m ${PUBLIC_URL}${PATH_SUFFIX}?port=${PORT}\\n"' > /usr/bin/serve-link && \
chmod +x /usr/bin/serve-link


# 5. Setup Workspace Directory
WORKDIR /home/codeuser/workspace
RUN chown -R codeuser:codeuser /home/codeuser/workspace


# 6. Environment variables for IDE Terminal & Frameworks
USER codeuser
ENV HOME=/home/codeuser
ENV TERM=xterm-256color
ENV HOST=0.0.0.0
ENV VITE_HOST=0.0.0.0
ENV PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${PATH}"


# 7. Shell Customization, Visual Polish, & Power-User Features
RUN echo 'echo -e "\\n\\e[1;36m┌──────────────────────────────────────────────────────────┐\\e[0m"' >> ~/.bashrc && \
    echo 'echo -e "\\e[1;36m│\\e[0m  \\e[1;32m🚀 Welcome to your Cloud IDE Workspace!\\e[0m                 \\e[1;36m│\\e[0m"' >> ~/.bashrc && \
    echo 'echo -e "\\e[1;36m│\\e[0m  To preview a web app, run \\e[1;33mserve-link <port>\\e[0m              \\e[1;36m│\\e[0m"' >> ~/.bashrc && \
    echo 'echo -e "\\e[1;36m└──────────────────────────────────────────────────────────┘\\e[0m\\n"' >> ~/.bashrc && \
    # FIX: Override npm run dev to force 0.0.0.0 host binding
    echo 'npm() { if [ "$1" = "run" ] && [ "$2" = "dev" ]; then command npm run dev -- --host 0.0.0.0 "${@:3}"; else command npm "$@"; fi; }' >> ~/.bashrc && \
    # FIX: Force bash window resize check for xterm.js responsiveness
    echo "shopt -s checkwinsize" >> ~/.bashrc && \
    # Visual Enhancements: Custom Colored PS1 Prompt (e.g., [coder@workspace ~/workspace]$)
    echo 'export PS1="\[\031[1;32m\]⚡ \u@ide\[\033[00m\]:\[\033[1;34m\]\w\[\033[00m\]\$ "' >> ~/.bashrc && \
    # Helpful Aliases
    echo "alias ls='ls --color=auto'" >> ~/.bashrc && \
    echo "alias grep='grep --color=auto'" >> ~/.bashrc && \
    echo "alias cls='clear'" >> ~/.bashrc && \
    echo "alias ll='ls -la'" >> ~/.bashrc


# 8. Process Management Entrypoint
ENTRYPOINT ["/usr/bin/tini", "--"]


# 9. Keep-Alive Command
CMD ["tail", "-f", "/dev/null"]
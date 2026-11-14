FROM tiger AS initial

FROM ubuntu:resolute

COPY script/devel/payload.tgz /tmp

RUN /usr/bin/apt update && \
    /usr/bin/apt install -y perl \
                            cpanminus \
                            build-essential \
                            file \
                            adduser \
                            passwd && \
    /usr/bin/apt install -y libclass-inspector-perl \
                            libhttp-message-perl libjson-perl \
                            liblwp-protocol-https-perl \
                            libmodern-perl-perl \
                            libmojolicious-perl \
                            libmojolicious-plugin-openapi-perl \
                            libmojolicious-plugin-templatetoolkit-perl \
                            libtemplate-perl \
                            libwww-perl \
                            libyaml-perl \
                            libyaml-pp-perl && \
    /usr/bin/rm -rf /var/lib/apt/lists/* && \
    /usr/bin/mkdir /tiger && \
    /usr/bin/tar -xvf /tmp/payload.tgz -C /tiger && \
    cd /tiger && \
    /usr/bin/rm -f /tmp/payload.tgz

ENV MOJO_PORT=8080

EXPOSE ${MOJO_PORT}

CMD ["/tiger/entrypoint.sh"]

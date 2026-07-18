# syntax=docker/dockerfile:1
# Dedicated Apache JMeter image for performance & load testing in the pipeline.
FROM eclipse-temurin:17-jre-jammy

ARG JMETER_VERSION=5.6.3
ENV JMETER_HOME=/opt/apache-jmeter-${JMETER_VERSION} \
    PATH=/opt/apache-jmeter-${JMETER_VERSION}/bin:$PATH

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && curl -fsSL https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-${JMETER_VERSION}.tgz \
       -o /tmp/jmeter.tgz \
    && tar -xzf /tmp/jmeter.tgz -C /opt \
    && rm /tmp/jmeter.tgz \
    && apt-get purge -y curl && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

WORKDIR /tests
COPY plans/ /tests/plans/

# Non-interactive CLI run producing a JTL result + HTML report consumed by CI.
ENTRYPOINT ["jmeter", "-n"]
CMD ["-t", "/tests/plans/truck-load-test.jmx", \
     "-l", "/tests/results/result.jtl", \
     "-e", "-o", "/tests/results/html"]

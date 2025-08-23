FROM python:3.14.0rc2-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8080
ENV HOST=0.0.0.0

EXPOSE 8080

# Fly.io specific entrypoint
CMD ["python", "app.py"]
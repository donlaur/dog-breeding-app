FROM python:3.10-slim
WORKDIR /app

# Install dependencies
COPY requirements.txt ./
RUN apt-get update && apt-get install -y curl && \
    pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of your backend code
COPY . .

# Set environment variables
ENV FLASK_APP=server/app.py
ENV FLASK_DEBUG=0
ENV PYTHONUNBUFFERED=1

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["python", "run.py"]

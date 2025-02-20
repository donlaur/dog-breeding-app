FROM python:3.10-slim
WORKDIR /app

# Install dependencies
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the rest of your backend code
COPY . .

# Expose the port (adjust if your Flask app listens on a different port)
EXPOSE 5000

# Run your Flask app (adjust the command if you use a different entry point)
CMD ["python", "run.py"]

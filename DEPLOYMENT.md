# Bacteriophage LIMS - Deployment Guide (Linux VPS)

Follow this guide to deploy your **Bacteriophage LIMS** to a Linux VPS (Ubuntu 22.04 or 24.04 recommended).

## 1. System Requirements (Prerequisites)
Perform initial server setup and install requirements:
```bash
chmod +x setup_linux.sh
./setup_linux.sh
```

## 2. Database Configuration (PostgreSQL)
Create your database and user:
```bash
sudo -u postgres psql
```
Inside the `psql` shell:
```sql
CREATE DATABASE bacteriophage_lims;
CREATE USER lims_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE bacteriophage_lims TO lims_user;
\q
```

## 3. Environment Variables (`.env`)
Update your `server/.env` file with production details:
```env
DB_NAME=bacteriophage_lims
DB_USER=lims_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your_secret_key
NODE_ENV=production
PORT=5002
```

## 4. Run the Application with PM2
Use **PM2** to manage your Node.js and Vite processes:
```bash
# Start backend and frontend
pm2 start ecosystem.config.js
# Ensure processes stay running after reboot
pm2 save
pm2 startup
```

## 5. Reverse Proxy Setup (Nginx)
Create an Nginx configuration file for your site:
```bash
sudo nano /etc/nginx/sites-available/lims
```
**Example Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com; # Or your VPS IP

    # Frontend (React/Vite)
    location / {
        proxy_pass http://localhost:5174;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
**Activate and Reload:**
```bash
sudo ln -s /etc/nginx/sites-available/lims /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 6. SSL Configuration (Optional but Recommended)
To secure your site with HTTPS, use **Certbot**:
```bash
sudo apt install python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 7. Backups
To perform a backup:
```bash
pg_dump -U lims_user bacteriophage_lims > backup_$(date +%F).sql
```
The application also has built-in automated backups in `server/backups/`.

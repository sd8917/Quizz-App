# Nginx + Let's Encrypt (Certbot) Setup Guide

This guide explains how to install **Nginx**, configure it as a reverse proxy for your Node.js application, and secure your website with a free **Let's Encrypt SSL certificate** using **Certbot** on **Ubuntu 22.04/24.04**.

---

# Prerequisites

- Ubuntu 22.04 or Ubuntu 24.04
- A registered domain name
- DNS A Record pointing to your server's public IP
- A Node.js application running (example: port **3000**)
- Root or sudo access

---

# Step 1 — Update the Server

```bash
sudo apt update
sudo apt upgrade -y
```

---

# Step 2 — Install Nginx

```bash
sudo apt install nginx -y
```

Verify installation:

```bash
nginx -v
```

Example:

```text
nginx version: nginx/1.24.0
```

Enable and start Nginx:

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

Check status:

```bash
sudo systemctl status nginx
```

---

# Step 3 — Configure Firewall

If UFW is enabled:

```bash
sudo ufw allow 'Nginx Full'
sudo ufw reload
```

Verify:

```bash
sudo ufw status
```

Expected:

```text
80/tcp
443/tcp
```

---

# Step 4 — Create an Nginx Site Configuration

Create a configuration file:

```bash
sudo nano /etc/nginx/sites-available/example.com
```

Replace `example.com` with your actual domain.

Paste the following configuration:

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    location / {
        proxy_pass http://localhost:3000;

        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

# Step 5 — Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/
```

---

# Step 6 — Remove the Default Site (Optional)

```bash
sudo rm /etc/nginx/sites-enabled/default
```

---

# Step 7 — Test Nginx Configuration

```bash
sudo nginx -t
```

Expected output:

```text
syntax is ok
test is successful
```

Reload Nginx:

```bash
sudo systemctl reload nginx
```

---

# Step 8 — Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

Verify installation:

```bash
certbot --version
```

---

# Step 9 — Obtain an SSL Certificate

Run:

```bash
sudo certbot --nginx
```

During installation:

- Select your domain
- Enter your email
- Accept Terms & Conditions
- Choose to redirect HTTP to HTTPS

Select:

```text
2
```

Certbot automatically updates your Nginx configuration.

---

# Step 10 — Verify HTTPS

Open:

```
https://example.com
```

You should see the secure lock icon.

---

# Step 11 — Test Auto Renewal

Dry run:

```bash
sudo certbot renew --dry-run
```

Verify timer:

```bash
systemctl list-timers | grep certbot
```

---

# Step 12 — Restart Nginx

```bash
sudo systemctl restart nginx
```

---

# Final HTTPS Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {

        proxy_pass http://localhost:3000;

        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name example.com www.example.com;

    return 301 https://$host$request_uri;
}
```

---

# Useful Commands

## Restart Nginx

```bash
sudo systemctl restart nginx
```

---

## Reload Nginx

```bash
sudo systemctl reload nginx
```

---

## Check Nginx Status

```bash
sudo systemctl status nginx
```

---

## View Error Logs

```bash
sudo tail -f /var/log/nginx/error.log
```

---

## View Access Logs

```bash
sudo tail -f /var/log/nginx/access.log
```

---

## Renew SSL Certificate

```bash
sudo certbot renew
```

---

## List Installed Certificates

```bash
sudo certbot certificates
```

---

# Common Issues

## 1. Domain Does Not Point to the Server

Verify DNS:

```bash
dig +short example.com
```

The output should match your server's public IP.

---

## 2. Ports 80 or 443 Are Blocked

Check firewall:

```bash
sudo ufw status
```

Check listening ports:

```bash
sudo ss -tulpn | grep -E ':80|:443'
```

Also ensure your cloud provider's firewall/security group allows inbound:

- TCP 80
- TCP 443

---

## 3. Nginx Configuration Error

Always test before reloading:

```bash
sudo nginx -t
```

---

## 4. Certbot Fails

Check if another process is using port 80:

```bash
sudo lsof -i :80
```

Restart Nginx:

```bash
sudo systemctl restart nginx
```

Retry:

```bash
sudo certbot --nginx
```

---

## 5. 502 Bad Gateway

Verify your Node.js application is running:

```bash
pm2 status
```

or

```bash
sudo systemctl status your-app
```

Confirm the application is listening on the expected port:

```bash
sudo ss -tulpn | grep 3000
```

---

# Directory Structure

```text
/etc/nginx
├── nginx.conf
├── sites-available
│   └── example.com
└── sites-enabled
    └── example.com -> /etc/nginx/sites-available/example.com

/etc/letsencrypt
└── live
    └── example.com
        ├── fullchain.pem
        └── privkey.pem
```

---

# Best Practices

- Always run `sudo nginx -t` before reloading Nginx.
- Use `sudo systemctl reload nginx` after configuration changes.
- Keep Ubuntu packages updated.
- Enable automatic SSL renewal.
- Regularly monitor Nginx logs.
- Back up your Nginx configuration before making major changes.
- Use PM2 or systemd to keep your Node.js application running.

---

# License

This guide is provided for educational and production deployment purposes.
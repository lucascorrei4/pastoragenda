# 🚀 PastorAgenda Deployment Guide

## 📋 **Prerequisites**

### **1. VPS Server Requirements**
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB
- **Domain**: Your domain pointing to the server IP

### **2. Server Software Installation**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install Supabase CLI
npm install -g supabase

# Install Git
sudo apt install git -y
```

### **3. Server Configuration**
```bash
# Create deployment user (optional but recommended)
sudo adduser deploy
sudo usermod -aG sudo deploy

# Create web directory
sudo mkdir -p /var/www/pastoragenda
sudo chown $USER:$USER /var/www/pastoragenda

# Configure firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 🔐 **GitHub Secrets Setup**

You need to add these secrets in your GitHub repository:

### **Required Secrets:**
1. **`SSH_HOST`** - Your VPS IP address
2. **`SSH_USER`** - SSH username (usually `root` or `deploy`)
3. **`SSH_PRIVATE_KEY`** - Your private SSH key
4. **`SSH_PORT`** - SSH port (usually `22`)
5. **`VITE_SUPABASE_URL`** - Your Supabase project URL
6. **`VITE_SUPABASE_ANON_KEY`** - Your Supabase anonymous key
7. **`VITE_APP_URL`** - Your app URL (e.g., `https://yourdomain.com`)
8. **`SUPABASE_PROJECT_REF`** - Your Supabase project reference ID
9. **`SUPABASE_ACCESS_TOKEN`** - Your Supabase access token

### **How to Add Secrets:**
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its corresponding value

## 🌐 **Domain & SSL Setup**

### **1. Domain Configuration**
```bash
# Edit nginx configuration
sudo nano /etc/nginx/sites-available/pastoragenda

# Replace 'your-domain.com' with your actual domain
server_name yourdomain.com www.yourdomain.com;
```

### **2. SSL Certificate (Let's Encrypt)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📁 **Project Structure on Server**

After deployment, your server will have this structure:
```
/var/www/pastoragenda/
├── client/                 # Frontend build files
│   ├── dist/              # Vite build output
│   ├── package.json
│   └── ...
├── supabase/              # Supabase functions
│   ├── supabase/          # Supabase CLI files
│   ├── package.json
│   └── ...
├── package.json           # Root package.json
├── package-lock.json      # Root package-lock.json
├── deploy.sh             # Deployment script
├── nginx.conf            # Nginx configuration
└── ecosystem.config.js   # PM2 configuration
```

## 🚀 **Deployment Process**

### **1. Automatic Deployment (GitHub Actions)**
- Push to `main` branch triggers deployment
- GitHub Actions builds both client and supabase packages
- Creates deployment package and uploads to server
- Server extracts package and runs deployment script

### **2. Manual Deployment (if needed)**
```bash
# On your local machine
npm run build:client
npm run build:supabase

# Create deployment package
tar -czf deploy-package.tar.gz -C packages/client/dist . -C ../../packages/supabase/supabase .

# Upload to server
scp deploy-package.tar.gz user@your-server:/tmp/

# On server
cd /var/www/pastoragenda
tar -xzf /tmp/deploy-package.tar.gz
./deploy.sh
```

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **1. Build Failures**
```bash
# Check build logs
npm run build:client
npm run build:supabase

# Verify environment variables
cat packages/client/.env
```

#### **2. Deployment Failures**
```bash
# Check deployment logs
tail -f /var/log/nginx/error.log
pm2 logs pastoragenda

# Verify file permissions
ls -la /var/www/pastoragenda/
```

#### **3. Nginx Issues**
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx
```

#### **4. PM2 Issues**
```bash
# Check PM2 status
pm2 status

# Restart application
pm2 restart pastoragenda

# View logs
pm2 logs pastoragenda
```

## 📊 **Monitoring & Maintenance**

### **1. Application Monitoring**
```bash
# PM2 monitoring
pm2 monit

# System resources
htop
df -h
free -h
```

### **2. Log Monitoring**
```bash
# Application logs
pm2 logs pastoragenda --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

### **3. Regular Maintenance**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js (if needed)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clean up old builds
sudo find /var/www/pastoragenda -name "*.tar.gz" -mtime +7 -delete
```

## 🔒 **Security Considerations**

### **1. Server Security**
- Keep system updated
- Use SSH keys instead of passwords
- Configure firewall properly
- Regular security audits

### **2. Application Security**
- Environment variables for sensitive data
- HTTPS enforcement
- Security headers in nginx
- Regular dependency updates

### **3. Database Security**
- Supabase Row Level Security (RLS)
- Environment-specific API keys
- Regular backup procedures

## 📈 **Performance Optimization**

### **1. Nginx Optimization**
```nginx
# Enable gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Browser caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### **2. PM2 Optimization**
```javascript
// ecosystem.config.js
{
  instances: 'max',
  exec_mode: 'cluster',
  max_memory_restart: '1G'
}
```

## 🎯 **Next Steps After Deployment**

1. **Test your application** at your domain
2. **Verify PWA functionality** on mobile devices
3. **Set up monitoring** and alerting
4. **Configure backups** for your database
5. **Set up CI/CD** for future deployments
6. **Monitor performance** and optimize as needed

## 📞 **Support**

If you encounter issues:
1. Check the troubleshooting section above
2. Review GitHub Actions logs
3. Check server logs and status
4. Verify all environment variables are set correctly
5. Ensure server meets minimum requirements

---

**Happy Deploying! 🚀**

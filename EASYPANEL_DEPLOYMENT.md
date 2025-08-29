# 🚀 **PastorAgenda Deployment Guide for Easypanel**

This guide will help you deploy PastorAgenda to your server using Easypanel and Docker.

## 📋 **Prerequisites**

- Server with Easypanel installed
- Domain pointing to your server
- Supabase project set up

## 🔧 **Step 1: Prepare Your Repository**

1. **Ensure your repository has the correct files:**
   - ✅ `Dockerfile` (fixed for monorepo)
   - ✅ `docker-compose.yml`
   - ✅ `package.json` (root and client)
   - ✅ All source code in `packages/client/`

2. **Verify the build works locally:**
   ```bash
   npm run build:client
   ```

## 🐳 **Step 2: Deploy with Easypanel**

### **Option A: Using Docker Compose (Recommended)**

1. **SSH into your server**
2. **Clone your repository:**
   ```bash
   git clone https://github.com/lucascorrei4/pastoragenda.git
   cd pastoragenda
   ```

3. **Create environment file:**
   ```bash
   cp env.example .env
   nano .env
   ```
   
   **Fill in your values:**
   ```bash
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_APP_URL=https://yourdomain.com
   NODE_ENV=production
   PORT=4000
   ```

4. **Build and start the container:**
   ```bash
   docker-compose up -d --build
   ```

5. **Check container status:**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

### **Option B: Using Easypanel UI**

1. **Open Easypanel dashboard**
2. **Go to "Services" → "New Service"**
3. **Select "Docker Compose"**
4. **Upload your `docker-compose.yml` file**
5. **Set environment variables in the UI**
6. **Deploy the service**

## 🌐 **Step 3: Configure Nginx Proxy (if needed)**

If you need to proxy through Nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔐 **Step 4: SSL Configuration**

### **Using Certbot:**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### **Using Easypanel SSL:**
1. Go to your domain settings in Easypanel
2. Enable SSL certificate
3. Choose Let's Encrypt or your preferred provider

## 📊 **Step 5: Monitoring & Maintenance**

### **Check Container Health:**
```bash
# Container status
docker-compose ps

# Container logs
docker-compose logs -f pastoragenda

# Container stats
docker stats pastoragenda-app
```

### **Update Application:**
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up -d --build
```

### **Backup and Restore:**
```bash
# Backup container data
docker-compose exec pastoragenda tar -czf /app/backup.tar.gz /app/packages/client/dist

# Copy backup from container
docker cp pastoragenda-app:/app/backup.tar.gz ./backup.tar.gz
```

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Build fails:**
   ```bash
   # Check build logs
   docker-compose logs pastoragenda
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

2. **Container won't start:**
   ```bash
   # Check container logs
   docker-compose logs pastoragenda
   
   # Check container status
   docker-compose ps
   ```

3. **Port conflicts:**
   ```bash
   # Check what's using port 4000
   sudo netstat -tlnp | grep :4000
   
   # Change port in docker-compose.yml if needed
   ```

4. **Environment variables not working:**
   ```bash
   # Check environment in container
   docker-compose exec pastoragenda env | grep VITE
   
   # Restart container after env changes
   docker-compose restart pastoragenda
   ```

### **Debug Commands:**
```bash
# Enter container shell
docker-compose exec pastoragenda sh

# Check file structure
docker-compose exec pastoragenda ls -la /app

# Check build output
docker-compose exec pastoragenda ls -la /app/packages/client/dist

# Check PM2 status
docker-compose exec pastoragenda pm2 status
```

## ✅ **Verification Checklist**

- [ ] Container builds successfully
- [ ] Container starts without errors
- [ ] Application responds on port 4000
- [ ] Environment variables are loaded correctly
- [ ] Nginx proxy is configured (if using)
- [ ] SSL certificate is working
- [ ] Domain resolves correctly
- [ ] Application features work (auth, booking, etc.)

## 🎯 **Next Steps**

1. **Test your application** at your domain
2. **Verify PWA functionality** on mobile devices
3. **Set up monitoring** and alerting
4. **Configure backups** for your data
5. **Set up CI/CD** for future deployments

---

## 📞 **Support**

If you encounter issues:
1. Check the troubleshooting section above
2. Review container logs: `docker-compose logs -f`
3. Check Easypanel service status
4. Verify all environment variables are set correctly
5. Ensure your domain is pointing to the server

**Happy Deploying! 🚀✨**

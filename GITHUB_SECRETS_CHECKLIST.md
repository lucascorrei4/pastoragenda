# 🔐 GitHub Secrets Checklist for PastorAgenda Deployment

## 📋 **Required Secrets for GitHub Actions**

Add these secrets in your GitHub repository:
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### **🚀 Server Connection Secrets**
| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `SSH_HOST` | Your VPS IP address | `123.456.789.123` |
| `SSH_USER` | SSH username | `root` or `deploy` |
| `SSH_PRIVATE_KEY` | Your private SSH key | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SSH_PORT` | SSH port number | `22` |

### **🔑 Supabase Configuration Secrets**
| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://abcdefghijklmnop.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_PROJECT_REF` | Your Supabase project reference ID | `abcdefghijklmnop` |
| `SUPABASE_ACCESS_TOKEN` | Your Supabase access token | `sbp_1234567890abcdef...` |

### **🌐 Application Configuration Secrets**
| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `VITE_APP_URL` | Your app's public URL | `https://pastoragenda.com` |

## 🔍 **How to Find These Values**

### **1. Supabase Values**
1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **Project ref** → `SUPABASE_PROJECT_REF`

### **2. Supabase Access Token**
1. Go to [supabase.com](https://supabase.com) → **Account** → **Access Tokens**
2. Generate a new token or copy existing one
3. Use as `SUPABASE_ACCESS_TOKEN`

### **3. Server Values**
- **SSH_HOST**: Your VPS IP address from Hostinger
- **SSH_USER**: Usually `root` or the username you created
- **SSH_PRIVATE_KEY**: Your private SSH key file content
- **SSH_PORT**: Usually `22` (default SSH port)

### **4. App URL**
- **VITE_APP_URL**: Your domain (e.g., `https://pastoragenda.com`)

## ✅ **Verification Checklist**

Before pushing to trigger deployment:

- [ ] All 9 secrets are added to GitHub
- [ ] SSH key is properly configured on your VPS
- [ ] Supabase project is set up and accessible
- [ ] Domain is pointing to your VPS IP
- [ ] VPS has required software installed (Node.js, Nginx, PM2)

## 🚨 **Important Notes**

1. **Never commit secrets** to your repository
2. **Use environment-specific keys** for production vs development
3. **Rotate keys regularly** for security
4. **Test deployment** on a staging environment first
5. **Keep SSH keys secure** and don't share them

## 🔧 **Troubleshooting Secrets**

### **Common Issues:**
- **Build fails**: Check if all environment variables are set
- **Deployment fails**: Verify SSH connection and permissions
- **App doesn't work**: Ensure Supabase keys are correct
- **SSL issues**: Check domain configuration and certificates

### **Testing Secrets:**
```bash
# Test SSH connection
ssh -i your-key.pem user@your-server-ip

# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "YOUR_SUPABASE_URL/rest/v1/"
```

---

**Ready to deploy? Make sure all secrets are set! 🔐✅**

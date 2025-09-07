#!/usr/bin/env node

/**
 * Test script for Prerender.io setup
 * This tests if prerender is working correctly
 */

const http = require('http')

// Test if prerender server is running
function testPrerenderServer() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3001/health', (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        console.log('✅ Prerender server is running')
        console.log('Response:', data)
        resolve(true)
      })
    })
    
    req.on('error', (err) => {
      console.log('❌ Prerender server is not running')
      console.log('Error:', err.message)
      console.log('\nTo start prerender server, run:')
      console.log('npm run prerender')
      resolve(false)
    })
    
    req.setTimeout(5000, () => {
      console.log('❌ Prerender server timeout')
      resolve(false)
    })
  })
}

// Test prerendering a page
function testPrerenderPage() {
  return new Promise((resolve, reject) => {
    const testUrl = 'http://localhost:3001/https://pastoragenda.com/prvinialt'
    
    const req = http.get(testUrl, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        console.log('✅ Prerender page test')
        console.log('Status:', res.statusCode)
        console.log('Content length:', data.length)
        
        // Check if it contains meta tags
        if (data.includes('og:title') && data.includes('og:image')) {
          console.log('✅ Meta tags found in prerendered HTML')
        } else {
          console.log('❌ Meta tags not found in prerendered HTML')
        }
        
        resolve(true)
      })
    })
    
    req.on('error', (err) => {
      console.log('❌ Prerender page test failed')
      console.log('Error:', err.message)
      resolve(false)
    })
  })
}

// Main test function
async function runTests() {
  console.log('🧪 Testing Prerender.io Setup\n')
  
  const serverRunning = await testPrerenderServer()
  
  if (serverRunning) {
    console.log('\n📄 Testing page prerendering...')
    await testPrerenderPage()
  }
  
  console.log('\n📋 Next Steps:')
  console.log('1. Make sure your React app is running on port 3000')
  console.log('2. Start prerender: npm run prerender')
  console.log('3. Test with: curl -H "User-Agent: WhatsApp/2.0" http://localhost:3001/https://pastoragenda.com/prvinialt')
  console.log('4. Configure Nginx with nginx-prerender.conf for production')
}

runTests()

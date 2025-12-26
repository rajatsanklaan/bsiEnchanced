/**
 * Helper script to get SharePoint SITE_ID and DRIVE_ID
 * 
 * Usage:
 * 1. Set your environment variables (CLIENT_ID, CLIENT_SECRET, TENANT_ID)
 * 2. Run: npx ts-node scripts/get-sharepoint-ids.ts
 * 
 * Or run directly with node after building
 */

import { ConfidentialClientApplication } from '@azure/msal-node';

// Configuration - update these or use environment variables
const CONFIG = {
  clientId: process.env.CLIENT_ID || 'YOUR_CLIENT_ID',
  clientSecret: process.env.CLIENT_SECRET || 'YOUR_CLIENT_SECRET',
  tenantId: process.env.TENANT_ID || 'YOUR_TENANT_ID',
  
  // Your SharePoint site URL (just the tenant and site name)
  // Example: "contoso.sharepoint.com" and "FinanceData"
  sharePointTenant: process.env.SP_TENANT || 'YOUR_TENANT.sharepoint.com',
  sharePointSiteName: process.env.SP_SITE_NAME || 'YOUR_SITE_NAME',
};

async function getAccessToken(): Promise<string> {
  const msalConfig = {
    auth: {
      clientId: CONFIG.clientId,
      clientSecret: CONFIG.clientSecret,
      authority: `https://login.microsoftonline.com/${CONFIG.tenantId}`,
    },
  };

  const cca = new ConfidentialClientApplication(msalConfig);
  
  const response = await cca.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  });

  if (!response?.accessToken) {
    throw new Error('Failed to acquire access token');
  }

  return response.accessToken;
}

async function getSiteId(token: string): Promise<string> {
  const url = `https://graph.microsoft.com/v1.0/sites/${CONFIG.sharePointTenant}:/sites/${CONFIG.sharePointSiteName}`;
  
  console.log(`\n📍 Fetching site info from: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get site: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.id;
}

async function getDrives(token: string, siteId: string): Promise<any[]> {
  const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`;
  
  console.log(`\n📁 Fetching drives from site...`);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get drives: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.value;
}

async function listFilesInDrive(token: string, driveId: string): Promise<any[]> {
  const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/root/children`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.value || [];
}

async function main() {
  console.log('🔐 SharePoint ID Finder');
  console.log('=======================\n');

  // Validate config
  if (CONFIG.clientId === 'YOUR_CLIENT_ID' || CONFIG.sharePointTenant === 'YOUR_TENANT.sharepoint.com') {
    console.log('⚠️  Please update the CONFIG object in this script with your values:\n');
    console.log('   - clientId: Your Azure AD Client ID');
    console.log('   - clientSecret: Your Azure AD Client Secret');
    console.log('   - tenantId: Your Azure AD Tenant ID');
    console.log('   - sharePointTenant: e.g., "contoso.sharepoint.com"');
    console.log('   - sharePointSiteName: e.g., "FinanceData"\n');
    console.log('Or set environment variables: CLIENT_ID, CLIENT_SECRET, TENANT_ID, SP_TENANT, SP_SITE_NAME');
    return;
  }

  try {
    // Get access token
    console.log('🔑 Acquiring access token...');
    const token = await getAccessToken();
    console.log('✅ Token acquired successfully!\n');

    // Get Site ID
    const siteId = await getSiteId(token);
    console.log('\n✅ SITE_ID found!');
    console.log('━'.repeat(60));
    console.log(`SITE_ID=${siteId}`);
    console.log('━'.repeat(60));

    // Get Drives
    const drives = await getDrives(token, siteId);
    
    console.log('\n📂 Available Drives:');
    console.log('━'.repeat(60));
    
    for (const drive of drives) {
      const files = await listFilesInDrive(token, drive.id);
      const excelFiles = files.filter((f: any) => f.name?.endsWith('.xlsx') || f.name?.endsWith('.xls'));
      
      console.log(`\n  📁 ${drive.name}`);
      console.log(`     DRIVE_ID=${drive.id}`);
      console.log(`     Type: ${drive.driveType}`);
      
      if (excelFiles.length > 0) {
        console.log(`     📊 Excel files found:`);
        excelFiles.forEach((f: any) => console.log(`        - ${f.name}`));
      }
    }
    
    console.log('\n' + '━'.repeat(60));
    console.log('\n📋 Copy these to your .env.local file:\n');
    console.log(`SITE_ID=${siteId}`);
    if (drives.length > 0) {
      console.log(`DRIVE_ID=${drives[0].id}  # ${drives[0].name}`);
    }
    console.log('\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Verify your CLIENT_ID, CLIENT_SECRET, and TENANT_ID are correct');
    console.log('2. Ensure your Azure AD app has these permissions:');
    console.log('   - Sites.Read.All (Application)');
    console.log('   - Files.Read.All (Application)');
    console.log('3. Verify admin consent has been granted');
    console.log('4. Check that the SharePoint site name is correct');
  }
}

main();


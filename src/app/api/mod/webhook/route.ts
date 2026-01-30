import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

const octokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId: process.env.GITHUB_APP_ID!,
    privateKey: process.env.GITHUB_PRIVATE_KEY!,
    installationId: process.env.GITHUB_INSTALLATION_ID!,
  },
});

const owner = 'madebypunks';
const repo = 'directory';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.action === 'createPR') {
      return await createPullRequest(body);
    }
    
    if (body.action === 'updatePR') {
      return await updatePullRequest(body);
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createPullRequest(data: any) {
  const { title, files, imageUrl } = data;
  
  // Create a new branch
  const timestamp = Date.now();
  const branchName = `punkmodbot-${timestamp}`;
  
  // Get the default branch ref
  const { data: defaultBranch } = await octokit.rest.repos.get({
    owner,
    repo,
  });
  
  const { data: mainRef } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${defaultBranch.default_branch}`,
  });
  
  // Create new branch
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: mainRef.object.sha,
  });
  
  // Handle image upload if present
  if (imageUrl && data.projectSlug) {
    try {
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      
      // Upload image to public/projects/
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: `public/projects/${data.projectSlug}.png`,
        message: `Add thumbnail for ${data.projectSlug}`,
        content: imageBase64,
        branch: branchName,
      });
    } catch (imageError) {
      console.error('Error uploading image:', imageError);
    }
  }
  
  // Create/update files
  for (const file of files) {
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: file.filename,
      message: `Update ${file.filename}`,
      content: Buffer.from(file.content).toString('base64'),
      branch: branchName,
    });
  }
  
  // Create pull request
  const { data: pr } = await octokit.rest.pulls.create({
    owner,
    repo,
    title,
    head: branchName,
    base: defaultBranch.default_branch,
    body: 'Created by PunkModBot 🤖',
  });
  
  return NextResponse.json({ 
    success: true, 
    pullRequest: pr.html_url,
    number: pr.number 
  });
}

async function updatePullRequest(data: any) {
  const { prNumber, files, imageUrl, projectSlug } = data;
  
  // Get the PR details to get the branch name
  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });
  
  const branchName = pr.head.ref;
  
  // Handle image upload if present
  if (imageUrl && projectSlug) {
    try {
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      
      // Check if image already exists
      let imageSha;
      try {
        const { data: existingImage } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: `public/projects/${projectSlug}.png`,
          ref: branchName,
        });
        if (!Array.isArray(existingImage)) {
          imageSha = existingImage.sha;
        }
      } catch (error) {
        // Image doesn't exist, that's fine
      }
      
      // Upload/update image
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: `public/projects/${projectSlug}.png`,
        message: `Update thumbnail for ${projectSlug}`,
        content: imageBase64,
        branch: branchName,
        sha: imageSha,
      });
    } catch (imageError) {
      console.error('Error updating image:', imageError);
    }
  }
  
  // Update files
  for (const file of files) {
    // Get current file SHA if it exists
    let fileSha;
    try {
      const { data: existingFile } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: file.filename,
        ref: branchName,
      });
      if (!Array.isArray(existingFile)) {
        fileSha = existingFile.sha;
      }
    } catch (error) {
      // File doesn't exist, that's fine
    }
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: file.filename,
      message: `Update ${file.filename}`,
      content: Buffer.from(file.content).toString('base64'),
      branch: branchName,
      sha: fileSha,
    });
  }
  
  return NextResponse.json({ 
    success: true, 
    pullRequest: pr.html_url,
    updated: true
  });
}
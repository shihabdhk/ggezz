import fetch from 'node-fetch';

// This is the Vercel Serverless Function handler
export default async (req, res) => {
    // 1. Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { recaptchaToken } = req.body;

    if (!recaptchaToken) {
        return res.status(400).json({ success: false, error: 'reCAPTCHA token missing' });
    }

    // 2. Get the SECRET KEY securely from Vercel Environment Variables
    const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
    
    // 3. Prepare the verification request to Google
    const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${recaptchaToken}`;

    try {
        const googleResponse = await fetch(verificationURL, { method: 'POST' });
        const data = await googleResponse.json();

        // 4. Check Google's response
        if (data.success && data.score > 0.5) {
            // Success: Score is high enough (0.5 is a common default threshold)
            return res.status(200).json({ 
                success: true, 
                message: 'reCAPTCHA verification successful.',
                score: data.score 
            });
        } else {
            // Failure: Low score or other error
            return res.status(401).json({ 
                success: false, 
                error: 'reCAPTCHA verification failed or low score.',
                score: data.score,
                'error-codes': data['error-codes'] 
            });
        }
    } catch (error) {
        console.error('Error during reCAPTCHA verification:', error);
        return res.status(500).json({ success: false, error: 'Server error during verification.' });
    }
};
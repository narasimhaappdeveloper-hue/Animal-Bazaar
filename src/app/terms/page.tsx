
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p className='font-semibold text-foreground'>Last updated: {new Date().toLocaleDateString()}</p>
          
          <p>Welcome to Animal Bazaar! These terms and conditions outline the rules and regulations for the use of Animal Bazaar's Website, located at this domain.</p>

          <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use Animal Bazaar if you do not agree to take all of the terms and conditions stated on this page.</p>

          <h3 className="text-lg font-semibold text-foreground pt-2">Cookies</h3>
          <p>We employ the use of cookies. By accessing Animal Bazaar, you agreed to use cookies in agreement with the Animal Bazaar's Privacy Policy.</p>

          <h3 className="text-lg font-semibold text-foreground pt-2">License</h3>
          <p>Unless otherwise stated, Animal Bazaar and/or its licensors own the intellectual property rights for all material on Animal Bazaar. All intellectual property rights are reserved. You may access this from Animal Bazaar for your own personal use subjected to restrictions set in these terms and conditions.</p>
          
          <p>You must not:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Republish material from Animal Bazaar</li>
            <li>Sell, rent or sub-license material from Animal Bazaar</li>
            <li>Reproduce, duplicate or copy material from Animal Bazaar</li>
            <li>Redistribute content from Animal Bazaar</li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground pt-2">Disclaimer</h3>
          <p>To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating to our website and the use of this website. Nothing in this disclaimer will:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>limit or exclude our or your liability for death or personal injury;</li>
            <li>limit or exclude our or your liability for fraud or fraudulent misrepresentation;</li>
            <li>limit any of our or your liabilities in any way that is not permitted under applicable law; or</li>
            <li>exclude any of our or your liabilities that may not be excluded under applicable law.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

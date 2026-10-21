
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p className='font-semibold text-foreground'>Last updated: {new Date().toLocaleDateString()}</p>

          <p>Your privacy is important to us. It is Animal Bazaar's policy to respect your privacy regarding any information we may collect from you across our website, and other sites we own and operate.</p>
          
          <h3 className="text-lg font-semibold text-foreground pt-2">Information We Collect</h3>
          <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
          
          <h3 className="text-lg font-semibold text-foreground pt-2">Log Data</h3>
          <p>We want to inform you that whenever you visit our Service, we collect information that your browser sends to us that is called Log Data. This Log Data may include information such as your computer’s Internet Protocol ("IP") address, browser version, pages of our Service that you visit, the time and date of your visit, the time spent on those pages, and other statistics.</p>

          <h3 className="text-lg font-semibold text-foreground pt-2">Security</h3>
          <p>We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security.</p>
          
          <h3 className="text-lg font-semibold text-foreground pt-2">Links to Other Sites</h3>
          <p>Our Service may contain links to other sites. If you click on a third-party link, you will be directed to that site. Note that these external sites are not operated by us. Therefore, we strongly advise you to review the Privacy Policy of these websites. We have no control over, and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.</p>

          <h3 className="text-lg font-semibold text-foreground pt-2">Changes to This Privacy Policy</h3>
          <p>We may update our Privacy Policy from time to time. Thus, we advise you to review this page periodically for any changes. We will notify you of any changes by posting the new Privacy Policy on this page. These changes are effective immediately, after they are posted on this page.</p>

        </CardContent>
      </Card>
    </div>
  );
}

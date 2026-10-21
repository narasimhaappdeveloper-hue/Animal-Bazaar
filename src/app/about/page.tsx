
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/logo';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="items-center">
          <Logo className="h-16 w-16 text-primary" />
          <CardTitle className="text-3xl">Animal Bazaar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground">
          <div className="text-center space-y-4">
            <p>
              Welcome to Animal Bazaar, the best place to buy and sell animals online.
            </p>
            <p>
              Our mission is to connect farmers, breeders, and pet lovers in a simple, trustworthy, and efficient marketplace. Whether you're looking to expand your livestock, find a new family pet, or sell your animals, Animal Bazaar is here to help.
            </p>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-2xl font-semibold text-center text-foreground mb-4">How to Use the App</h2>
            <ol className="list-decimal list-inside space-y-4 text-left max-w-lg mx-auto">
              <li>
                <span className="font-semibold text-foreground">Create an Account:</span> Sign up or log in to get started. You'll need an account to sell animals and contact sellers.
              </li>
              <li>
                <span className="font-semibold text-foreground">Browse Animals:</span> Use the search and filter options on the home page to find the perfect animal. You can filter by category, location, and more.
              </li>
              <li>
                <span className="font-semibold text-foreground">Post an Ad:</span> Click the '+' button to post an animal for sale. Fill in the details, upload a clear photo, and set your price. Our AI will help validate your image.
              </li>
              <li>
                <span className="font-semibold text-foreground">Contact Sellers:</span> When you find an animal you're interested in, you can request the seller's contact information. Once they approve, you'll be able to call them directly.
              </li>
            </ol>
          </div>
          
          <div className="border-t pt-6 text-center">
            <h3 className="text-2xl font-semibold text-foreground mb-4">How to Download the App</h3>
            <p className="max-w-2xl mx-auto">You can add Animal Bazaar to your home screen for quick and easy access, just like a native app.</p>
            <div className="grid md:grid-cols-2 gap-8 mt-4 text-left max-w-3xl mx-auto">
              <div>
                <h4 className="font-semibold text-foreground">For Android (using Chrome):</h4>
                <ol className="list-decimal list-inside space-y-2 mt-2">
                  <li>Open the Animal Bazaar website in your Chrome browser.</li>
                  <li>Tap the three-dot menu icon in the top-right corner.</li>
                  <li>Select 'Add to Home screen'.</li>
                  <li>Confirm the name and tap 'Add'.</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">For iOS (using Safari):</h4>
                <ol className="list-decimal list-inside space-y-2 mt-2">
                  <li>Open the Animal Bazaar website in your Safari browser.</li>
                  <li>Tap the 'Share' icon (a square with an arrow pointing up).</li>
                  <li>Scroll down and select 'Add to Home Screen'.</li>
                  <li>Confirm the name and tap 'Add' in the top-right corner.</li>
                </ol>
              </div>
            </div>
          </div>

          <p className="font-semibold text-foreground text-center pt-4">Version 1.0.0</p>
        </CardContent>
      </Card>
    </div>
  );
}

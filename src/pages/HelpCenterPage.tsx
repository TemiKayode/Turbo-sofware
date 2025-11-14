import { Layout } from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HelpCircle, Search, Book, MessageCircle, Video, FileText, Mail } from 'lucide-react'

export function HelpCenterPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-[#2CA01C]" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Help Center</h1>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for help articles, guides, or FAQs..."
                className="pl-10 pr-4 py-3 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-2">
                <Book className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Learn the basics of Turbo Software</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Account Setup</li>
                <li>• First Steps</li>
                <li>• Navigation Guide</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>Comprehensive guides and references</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• User Manual</li>
                <li>• API Documentation</li>
                <li>• Best Practices</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-2">
                <Video className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Video Tutorials</CardTitle>
              <CardDescription>Watch step-by-step tutorials</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Quick Start Videos</li>
                <li>• Advanced Features</li>
                <li>• Tips & Tricks</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-2">
                <MessageCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>FAQs</CardTitle>
              <CardDescription>Frequently asked questions</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Common Questions</li>
                <li>• Troubleshooting</li>
                <li>• Account Issues</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-2">
                <Mail className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>Get help from our support team</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-[#2CA01C] hover:bg-[#1e7a0f] text-white">
                Contact Us
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-2">
                <HelpCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle>Community</CardTitle>
              <CardDescription>Join our community forum</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Visit Forum
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Popular Articles */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Articles</CardTitle>
            <CardDescription>Most viewed help articles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    How to Create Your First Company
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Step-by-step guide to setting up your company profile and getting started with Turbo Software.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Managing Users and Permissions
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Learn how to add users, assign roles, and manage access permissions in your organization.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Understanding ERP Modules
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Comprehensive overview of all ERP modules including Inventory, Sales, Procurement, and Financials.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Troubleshooting Common Issues
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Solutions to frequently encountered problems and how to resolve them quickly.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support Section */}
        <Card className="bg-gradient-to-r from-[#2CA01C] to-[#1e7a0f] text-white">
          <CardHeader>
            <CardTitle className="text-white">Still Need Help?</CardTitle>
            <CardDescription className="text-white/80">
              Our support team is here to assist you 24/7
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                className="bg-white text-[#2CA01C] hover:bg-gray-100 border-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Support
              </Button>
              <Button
                variant="outline"
                className="bg-white text-[#2CA01C] hover:bg-gray-100 border-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Live Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}


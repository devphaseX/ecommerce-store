import { getGraphRevenue } from '@/actions/get-graph-revenue';
import { getTotalSales } from '@/actions/get-sale-product';
import { getProductsInStockCount } from '@/actions/get-stock-product';
import { getTotalRevenue } from '@/actions/get-total-revenue';
import { Overview } from '@/components/overview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { db } from '@/config/db/neon/initialize';
import { formatter } from '@/lib/utils';
import { stores } from '@/schema/store';
import { auth } from '@clerk/nextjs';
import { sql } from 'drizzle-orm';
import { CreditCard, DollarSign, Package } from 'lucide-react';
import { redirect } from 'next/navigation';
import { FC } from 'react';

interface DashboardPageProps extends PageBaseProps {
  params: { storeId: string };
}

const DashboardPage: FC<DashboardPageProps> = async ({ params }) => {
  const { userId } = auth();
  if (!userId) return redirect('/sign-in');

  const { storeId } = params;

  const store = await db.query.stores.findFirst({
    where: sql`${stores.id} = ${storeId} and ${stores.userId} = ${userId}`,
  });

  if (!store) return redirect('/');

  const [totalRevenue, totalSales, productsInStock, revenueInGraphForm] =
    await Promise.all([
      getTotalRevenue(storeId),
      getTotalSales(storeId),
      getProductsInStockCount(storeId),
      getGraphRevenue(storeId),
    ]);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading title="Dashboard" description="Overview of your store" />
        <Separator />
        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatter.format(totalRevenue)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalSales.length.toString().replace(/^([1-9]\w*)$/, '+$1')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Product In Stocks
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productsInStock.length}</div>
            </CardContent>
          </Card>
        </div>
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={revenueInGraphForm} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;

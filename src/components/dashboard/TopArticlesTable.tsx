import { motion } from "framer-motion";
import { Eye, Download, ExternalLink } from "lucide-react";
import type { TopPublication } from "@/types/ojs";

interface TopArticlesTableProps {
  data?: TopPublication[];
  maxItems?: number;
}

const TopArticlesTable = ({ data, maxItems = 10 }: TopArticlesTableProps) => {
  const articles = data?.slice(0, maxItems) || [];

  if (articles.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold font-heading text-foreground">Top Viewed Articles</h3>
        <p className="text-xs text-muted-foreground">
          Most viewed publications across all journals · Top {articles.length}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">#</th>
              <th className="text-left py-3 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">Article</th>
              <th className="text-right py-3 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                <span className="flex items-center justify-end gap-1"><Eye className="h-3 w-3" /> Views</span>
              </th>
              <th className="text-right py-3 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                <span className="flex items-center justify-end gap-1"><Download className="h-3 w-3" /> Downloads</span>
              </th>
              <th className="text-right py-3 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">Total</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article, index) => (
              <tr
                key={article.id}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <td className="py-3 px-2 text-muted-foreground font-mono text-xs">
                  {index + 1}
                </td>
                <td className="py-3 px-2 max-w-md">
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground line-clamp-2 text-sm leading-tight">
                      {article.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{article.authors}</p>
                    {article.doi && (
                      <a
                        href={`https://doi.org/${article.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        {article.doi}
                      </a>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 text-right font-mono text-sm">
                  {article.abstractViews.toLocaleString()}
                </td>
                <td className="py-3 px-2 text-right font-mono text-sm">
                  {article.galleyViews.toLocaleString()}
                </td>
                <td className="py-3 px-2 text-right font-mono text-sm font-semibold text-primary">
                  {article.totalViews.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default TopArticlesTable;

package i18n

// Translations holds all translation strings
type Translations struct {
	NoPostsFound                string
	NoPosts                     string
	Comments                    string
	NoCommentsYet               string
	YourName                    string
	YourEmail                   string
	LeaveComment                string
	CommentHelp                 string
	PostComment                 string
	Home                        string
	Tags                        string
	RSS                         string
	Views                       string
	PostsTagged                 string
	AllTags                     string
	NoPostsForTag               string
	NoTagsFound                 string
	ViewAllPostsTagged          string
	BrowseAllTags               string
}

// Languages contains all supported languages
var Languages = map[string]Translations{
	"en": {
		NoPostsFound:                "No posts found.",
		NoPosts:                     "No posts found.",
		Comments:                    "Comments",
		NoCommentsYet:               "No comments yet. Be the first to comment!",
		YourName:                    "Your name *",
		YourEmail:                   "Your email (optional)",
		LeaveComment:                "Leave a comment...",
		CommentHelp:                 "Comment may need to be reviewed before it appears on the website.",
		PostComment:                 "Post Comment",
		Home:                        "Home",
		Tags:                        "Tags",
		RSS:                         "RSS",
		Views:                       "views",
		PostsTagged:                 "Posts tagged",
		AllTags:                     "All Tags",
		NoPostsForTag:               "No posts found for this tag.",
		NoTagsFound:                 "No tags found.",
		ViewAllPostsTagged:          "View all posts tagged with",
		BrowseAllTags:               "Browse all tags",
	},
	"zh-CN": {
		NoPostsFound:                "未找到文章。",
		NoPosts:                     "未找到文章。",
		Comments:                    "评论",
		NoCommentsYet:               "还没有评论。成为第一个评论的人！",
		YourName:                    "您的名字 *",
		YourEmail:                   "您的邮箱（可选）",
		LeaveComment:                "留下评论...",
		CommentHelp:                 "评论可能需要审核后才会显示在网站上。",
		PostComment:                 "发表评论",
		Home:                        "首页",
		Tags:                        "标签",
		RSS:                         "RSS",
		Views:                       "次浏览",
		PostsTagged:                 "标签为",
		AllTags:                     "所有标签",
		NoPostsForTag:               "此标签下未找到文章。",
		NoTagsFound:                 "未找到标签。",
		ViewAllPostsTagged:          "查看所有标签为",
		BrowseAllTags:               "浏览所有标签",
	},
}

// GetTranslations returns the translations for the given language
// Falls back to English if language is not found
func GetTranslations(lang string) Translations {
	if trans, ok := Languages[lang]; ok {
		return trans
	}
	return Languages["en"]
}

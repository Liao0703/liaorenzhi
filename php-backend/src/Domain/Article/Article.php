<?php
declare(strict_types=1);

namespace App\Domain\Article;

class Article
{
    private string $id;
    private string $title;
    private string $content;
    private ?string $category;
    private ?array $tags;
    private string $difficulty;
    private int $estimatedTime;
    private ?array $quizData;
    private string $status;
    private string $createdAt;
    private string $updatedAt;

    public function __construct(
        string $id,
        string $title,
        string $content,
        ?string $category = null,
        ?array $tags = null,
        string $difficulty = 'medium',
        int $estimatedTime = 0,
        ?array $quizData = null,
        string $status = 'published',
        string $createdAt = '',
        string $updatedAt = ''
    ) {
        $this->id = $id;
        $this->title = $title;
        $this->content = $content;
        $this->category = $category;
        $this->tags = $tags;
        $this->difficulty = $difficulty;
        $this->estimatedTime = $estimatedTime;
        $this->quizData = $quizData;
        $this->status = $status;
        $this->createdAt = $createdAt ?: date('Y-m-d H:i:s');
        $this->updatedAt = $updatedAt ?: date('Y-m-d H:i:s');
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getContent(): string
    {
        return $this->content;
    }

    public function getCategory(): ?string
    {
        return $this->category;
    }

    public function getTags(): ?array
    {
        return $this->tags;
    }

    public function getDifficulty(): string
    {
        return $this->difficulty;
    }

    public function getEstimatedTime(): int
    {
        return $this->estimatedTime;
    }

    public function getQuizData(): ?array
    {
        return $this->quizData;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function getCreatedAt(): string
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): string
    {
        return $this->updatedAt;
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    public function hasQuiz(): bool
    {
        return !empty($this->quizData);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $this->content,
            'category' => $this->category,
            'tags' => $this->tags,
            'difficulty' => $this->difficulty,
            'estimated_time' => $this->estimatedTime,
            'quiz_data' => $this->quizData,
            'status' => $this->status,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt
        ];
    }
}





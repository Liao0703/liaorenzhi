<?php
declare(strict_types=1);

namespace App\Domain\User;

class User
{
    private ?int $id;
    private string $username;
    private string $password;
    private string $name;
    private ?string $fullName;
    private string $role;
    private ?string $employeeId;
    private ?string $company;
    private ?string $department;
    private ?string $team;
    private ?string $jobType;
    private ?string $email;
    private ?string $phone;
    private string $createdAt;
    private string $updatedAt;

    public function __construct(
        ?int $id,
        string $username,
        string $password,
        string $name,
        ?string $fullName = null,
        string $role = 'user',
        ?string $employeeId = null,
        ?string $company = null,
        ?string $department = null,
        ?string $team = null,
        ?string $jobType = null,
        ?string $email = null,
        ?string $phone = null,
        string $createdAt = '',
        string $updatedAt = ''
    ) {
        $this->id = $id;
        $this->username = $username;
        $this->password = $password;
        $this->name = $name;
        $this->fullName = $fullName;
        $this->role = $role;
        $this->employeeId = $employeeId;
        $this->company = $company;
        $this->department = $department;
        $this->team = $team;
        $this->jobType = $jobType;
        $this->email = $email;
        $this->phone = $phone;
        $this->createdAt = $createdAt ?: date('Y-m-d H:i:s');
        $this->updatedAt = $updatedAt ?: date('Y-m-d H:i:s');
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUsername(): string
    {
        return $this->username;
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getFullName(): ?string
    {
        return $this->fullName;
    }

    public function getRole(): string
    {
        return $this->role;
    }

    public function getEmployeeId(): ?string
    {
        return $this->employeeId;
    }

    public function getCompany(): ?string
    {
        return $this->company;
    }

    public function getDepartment(): ?string
    {
        return $this->department;
    }

    public function getTeam(): ?string
    {
        return $this->team;
    }

    public function getJobType(): ?string
    {
        return $this->jobType;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function getPhone(): ?string
    {
        return $this->phone;
    }

    public function getCreatedAt(): string
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): string
    {
        return $this->updatedAt;
    }

    public function verifyPassword(string $password): bool
    {
        return password_verify($password, $this->password);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isMaintenance(): bool
    {
        return $this->role === 'maintenance';
    }

    public function toArray(bool $includePassword = false): array
    {
        $data = [
            'id' => $this->id,
            'username' => $this->username,
            'name' => $this->name,
            'full_name' => $this->fullName,
            'role' => $this->role,
            'employee_id' => $this->employeeId,
            'company' => $this->company,
            'department' => $this->department,
            'team' => $this->team,
            'job_type' => $this->jobType,
            'email' => $this->email,
            'phone' => $this->phone,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt
        ];

        if ($includePassword) {
            $data['password'] = $this->password;
        }

        return $data;
    }
}




